import logging
import torch
from typing import Optional, Any

logger = logging.getLogger("modelsmith.model_manager")

TIER_CONFIGS = {
    1: {"max_params_b": 0, "error": "Tier 1 systems cannot load real models (minimum 8GB RAM required)"},
    2: {"max_params_b": 3, "load_in_4bit": True, "torch_dtype": torch.float16},
    3: {"max_params_b": 13, "load_in_4bit": True, "torch_dtype": torch.float16},
    4: {"max_params_b": 34, "load_in_8bit": False, "torch_dtype": torch.bfloat16},
    5: {"max_params_b": 999, "load_in_4bit": False, "torch_dtype": torch.bfloat16},
}


class ModelManager:
    def __init__(self):
        self.model: Any = None
        self.tokenizer: Any = None
        self.model_path: str = ""
        self.model_tier: int = 0
        self.model_size_b: float = 0

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    @staticmethod
    def format_size(bytes_val: int) -> str:
        gb = bytes_val / (1024**3)
        if gb < 1:
            return f"{bytes_val / (1024**2):.0f} MB"
        return f"{gb:.1f} GB"

    def compute_load_config(self, tier: int, model_size_billions: float) -> dict:
        config = TIER_CONFIGS.get(tier)
        if not config:
            raise ValueError(f"Unknown tier: {tier}")
        if tier <= 1:
            raise ValueError(config["error"])
        if model_size_billions > config["max_params_b"]:
            raise ValueError(
                f"Insufficient hardware for {model_size_billions}B model on Tier {tier} "
                f"(max {config['max_params_b']}B)"
            )

        cuda_available = torch.cuda.is_available()
        quantization_config = None
        if config.get("load_in_4bit") and cuda_available:
            from transformers import BitsAndBytesConfig
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
            )

        torch_dtype = config["torch_dtype"]
        if not cuda_available and torch_dtype in (torch.float16, torch.bfloat16):
            torch_dtype = torch.float32

        return {
            "torch_dtype": torch_dtype,
            "quantization_config": quantization_config,
            "device_map": "auto" if cuda_available else None,
            "low_cpu_mem_usage": True,
        }

    def load(self, path: str, tier: int, model_size_billions: float) -> dict:
        from transformers import AutoModelForCausalLM, AutoTokenizer

        logger.info(f"Loading model from {path} (Tier {tier}, {model_size_billions}B)")
        self.unload()

        config = self.compute_load_config(tier, model_size_billions)
        self.tokenizer = AutoTokenizer.from_pretrained(path, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            path,
            trust_remote_code=True,
            **config,
        )
        self.model.eval()
        self.model_path = path
        self.model_tier = tier
        self.model_size_b = model_size_billions
        usage = self.get_memory_usage()
        logger.info(f"Model loaded. GPU memory: {usage['allocated']}")
        return {"status": "loaded", "memory": usage}

    def unload(self):
        if self.model is not None:
            del self.model
            self.model = None
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
        self.model_path = ""
        self.model_tier = 0
        self.model_size_b = 0
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("Model unloaded, GPU memory freed")

    def get_memory_usage(self) -> dict:
        allocated = torch.cuda.memory_allocated() if torch.cuda.is_available() else 0
        reserved = torch.cuda.memory_reserved() if torch.cuda.is_available() else 0
        return {
            "allocated": self.format_size(allocated),
            "allocated_bytes": allocated,
            "reserved": self.format_size(reserved),
            "reserved_bytes": reserved,
        }


_manager_instance: Optional[ModelManager] = None


def get_manager() -> ModelManager:
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = ModelManager()
    return _manager_instance
