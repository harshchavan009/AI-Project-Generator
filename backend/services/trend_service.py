"""
Trend Grounding Service: Maps engineering domains to modern, realistic 2025/2026 tech stacks,
reputable datasets, and engineering patterns accessible on student hardware.
"""

from typing import List, Dict, Any

TREND_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "AI/ML": {
        "modern_tools": ["PyTorch 2.4", "ONNX Runtime", "FastEmbed", "Hugging Face Transformers", "vLLM / Ollama", "DuckDB / Polars", "FastAPI"],
        "datasets": ["Hugging Face Datasets", "Kaggle Open Data", "PapersWithCode benchmarks", "arXiv CS.LG/CS.CV"],
        "student_friendly_techniques": ["LoRA / PEFT fine-tuning", "Quantization (INT8/FP4 via GGUF)", "Retrieval-Augmented Generation (RAG)", "TinyML"],
        "anti_patterns": ["Training 70B models from scratch", "Requiring 8x A100 clusters", "Basic Titanic survival predictor"]
    },
    "Computer Vision": {
        "modern_tools": ["YOLOv10 / RT-DETR", "MediaPipe 0.10+", "OpenCV 4.10", "Albumentations", "Supervision", "Gradio / Streamlit"],
        "datasets": ["Roboflow Universe", "COCO val2017", "Cityscapes subset", "PhysioNet Med-Imaging"],
        "student_friendly_techniques": ["Transfer learning on MobileNetV4", "Edge deployment via ONNX", "Real-time keypoint tracking"],
        "anti_patterns": ["Generic Haar-cascade face detector", "Full-frame 4K rendering on CPU"]
    },
    "IoT / Embedded": {
        "modern_tools": ["ESP32-S3", "MicroPython / FreeRTOS", "MQTT (EMQX / Mosquitto)", "TinyML (Edge Impulse)", "InfluxDB / TimescaleDB", "Grafana"],
        "datasets": ["NASA Turbofan Prognostics", "UCI Smart Meter datasets", "Real-time sensor telemetry"],
        "student_friendly_techniques": ["Edge anomaly detection", "Low-power deep sleep cycles", "Lightweight Protobuf serialisation"],
        "anti_patterns": ["Sending raw uncompressed video over 2G SIM", "Assuming uninterrupted Gigabit Wi-Fi"]
    },
    "Healthcare / BioTech": {
        "modern_tools": ["MONAI (Medical PyTorch)", "PhysioNet MIMIC-III Demo", "FastAPI", "FHIR JSON standard", "scikit-survival"],
        "datasets": ["PhysioNet PTB-XL ECG", "ISIC Skin Lesion Archive", "Kaggle Chest X-ray 14"],
        "student_friendly_techniques": ["Explainable AI (Grad-CAM, SHAP)", "De-identified tabular survival analysis", "Synthetic data balancing via SMOTE/GAN"],
        "anti_patterns": ["Violating HIPAA/GDPR mock guidelines", "Claiming clinical diagnostic approval"]
    },
    "Cybersecurity": {
        "modern_tools": ["Scapy", "Suricata / Zeek logs", "YARA rules", "Isolation forests", "NetworkX", "Wireshark PCAP"],
        "datasets": ["CIC-IDS2017 / CSE-CIC-IDS2018", "UNSW-NB15", "MITRE ATT&CK Enterprise Matrix"],
        "student_friendly_techniques": ["Zero-day behavior heuristics", "DNS exfiltration detection", "Graph-based lateral movement modeling"],
        "anti_patterns": ["Writing active malware or DDoS tools", "Hardcoding known IP blacklists only"]
    },
    "FinTech / Web3": {
        "modern_tools": ["FastAPI", "PostgreSQL with TimescaleDB", "LightGBM / XGBoost", "CCXT (Crypto Exchange API)", "Web3.py / Ethers.js", "Foundry / Hardhat"],
        "datasets": ["Kaggle Credit Card Fraud", "Yahoo Finance real-time tickers", "DeFi Llama telemetry"],
        "student_friendly_techniques": ["Class-imbalanced fraud detection", "Automated limit order simulation", "Micro-auditing smart contracts"],
        "anti_patterns": ["Creating speculative shitcoins", "Live trading with real student capital"]
    }
}

def get_trends_for_domains(interests: List[str]) -> Dict[str, Any]:
    matched_tools = set()
    matched_datasets = set()
    matched_techniques = set()
    anti_patterns = set()

    for interest in interests:
        for domain, info in TREND_KNOWLEDGE_BASE.items():
            if domain.lower() in interest.lower() or any(tag.lower() in domain.lower() for tag in interest.split()):
                matched_tools.update(info["modern_tools"])
                matched_datasets.update(info["datasets"])
                matched_techniques.update(info["student_friendly_techniques"])
                anti_patterns.update(info["anti_patterns"])

    # Fallback to general AI/ML + Web if nothing specifically matched
    if not matched_tools:
        info = TREND_KNOWLEDGE_BASE["AI/ML"]
        matched_tools.update(info["modern_tools"])
        matched_datasets.update(info["datasets"])
        matched_techniques.update(info["student_friendly_techniques"])

    return {
        "recommended_tools": list(matched_tools)[:8],
        "open_datasets": list(matched_datasets)[:4],
        "state_of_art_techniques": list(matched_techniques)[:5],
        "pitfalls_to_avoid": list(anti_patterns)[:4]
    }
