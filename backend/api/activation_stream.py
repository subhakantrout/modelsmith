"""WebSocket endpoint for streaming per-layer activation norms during ablation."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import logging
import time

from backend.core.model_manager import get_manager
from backend.core.abliterator import find_num_layers, detect_model_family

logger = logging.getLogger("modelsmith.activation_stream")

router = APIRouter()


@router.websocket("/api/ws/activations")
async def activation_stream(websocket: WebSocket):
    await websocket.accept()
    mgr = get_manager()
    if mgr.model is None:
        await websocket.send_json({"type": "error", "message": "No model loaded"})
        await websocket.close()
        return

    try:
        model_family = detect_model_family(mgr.model)
        num_layers = find_num_layers(mgr.model) or 32

        await websocket.send_json({
            "type": "meta",
            "model_family": model_family,
            "num_layers": num_layers,
        })

        # Find model layers
        if hasattr(mgr.model, 'model') and hasattr(mgr.model.model, 'layers'):
            layers = mgr.model.model.layers
        elif hasattr(mgr.model, 'transformer') and hasattr(mgr.model.transformer, 'h'):
            layers = mgr.model.transformer.h
        else:
            await websocket.send_json({
                "type": "error",
                "message": "Unsupported model architecture for activation streaming"
            })
            await websocket.close()
            return

        import torch
        device = next(mgr.model.parameters()).device
        stream_task = None

        async def stream_snapshots():
            try:
                while True:
                    norms = {}

                    def make_hook(idx):
                        def hook(module, input_, output):
                            if isinstance(output, tuple):
                                output = output[0]
                            norms[str(idx)] = round(
                                output.detach().float().norm(dim=-1).mean().item(), 4
                            )
                        return hook

                    hook_handles = []
                    for i, layer in enumerate(layers):
                        h = layer.register_forward_hook(make_hook(i))
                        hook_handles.append(h)

                    dummy = torch.randint(0, 100, (1, 8), device=device)
                    with torch.no_grad():
                        mgr.model(dummy)

                    for h in hook_handles:
                        h.remove()

                    await websocket.send_json({
                        "type": "snapshot",
                        "norms": norms,
                        "timestamp": time.time(),
                    })
                    await asyncio.sleep(0.5)
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.error(f"Stream error: {e}")

        stream_task = asyncio.create_task(stream_snapshots())

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("command") == "stop":
                stream_task.cancel()
                await websocket.close()
                break

    except WebSocketDisconnect:
        logger.info("Activation stream disconnected")
    except Exception as e:
        logger.error(f"Activation stream error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
