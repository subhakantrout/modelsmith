import asyncio
import threading
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.core.inference import generate_stream

router = APIRouter(prefix="/api/ws", tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

manager = ConnectionManager()

@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            prompt = data.get("prompt", "")
            if not prompt:
                continue

            try:
                loop = asyncio.get_running_loop()
                stream_queue: asyncio.Queue[str | None] = asyncio.Queue()

                def run_gen():
                    gen = generate_stream(
                        prompt=prompt,
                        max_new_tokens=data.get("max_new_tokens", 512),
                        temperature=data.get("temperature", 0.7),
                        top_p=data.get("top_p", 0.9),
                        system_prompt=data.get("system_prompt", ""),
                    )
                    for chunk in gen:
                        asyncio.run_coroutine_threadsafe(stream_queue.put(chunk), loop)
                    asyncio.run_coroutine_threadsafe(stream_queue.put(None), loop)

                thread = threading.Thread(target=run_gen, daemon=True)
                thread.start()

                while True:
                    chunk = await stream_queue.get()
                    if chunk is None:
                        break
                    await websocket.send_json({"type": "chunk", "text": chunk})

                await websocket.send_json({"type": "done"})

            except Exception as e:
                await websocket.send_json({"type": "error", "error": str(e)})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
