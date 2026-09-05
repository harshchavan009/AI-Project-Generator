import { ProjectIdea } from '../types';

export const FALLBACK_SAMPLE_IDEAS: ProjectIdea[] = [
  {
    id: "idea-001",
    title: "EdgeMed: Real-Time Chest Radiograph Triage with INT8 Quantization",
    domain: "Healthcare & Biomedical AI",
    description: "Hospital triage pipeline classifying 14 thoracic pathologies from DICOM images on CPU using INT8 ONNX models with Grad-CAM overlays.",
    required_skills: {
      python: 3,
      pytorch: 3,
      onnx_runtime: 3,
      fastapi: 2,
      opencv: 2
    },
    typical_timeline_weeks: 16,
    hardware_requirement: "CPU-only",
    component_count: 4,
    novel_algorithm_required: true,
    tech_stack: ["Python", "ONNX Runtime", "FastAPI", "PyTorch", "OpenCV", "React"],
    mvp_features: [
      "DICOM ingestion and windowing normalization pipeline",
      "INT8 quantized ResNet-50 inference engine on CPU",
      "Grad-CAM visual heatmap generator overlay"
    ],
    stretch_features: [
      "HL7 FHIR hospital interface adapter",
      "Offline browser WASM runtime export"
    ],
    combined_score: 87,
    relevance_score: 86,
    domain_similarity_percentage: 95,
    is_domain_match: true,
    skill_coverage: {
      coverage_ratio: 0.86,
      coverage_percentage: 86,
      matched_count: 4,
      total_required: 5,
      gap_severity: 0.14,
      missing_skills: ["opencv"],
      weak_skills: [],
      gap_breakdown: [
        {
          skill_id: "opencv",
          skill_name: "OpenCV",
          required_level: 2,
          actual_level: 0,
          deficit: 2,
          status: "missing",
          difficulty: 3
        }
      ],
      topological_learning_pathway: [
        {
          skill_id: "opencv",
          skill_name: "OpenCV Computer Vision",
          category: "Computer Vision",
          estimated_hours: 14,
          target_proficiency: 2,
          current_proficiency: 0,
          is_prerequisite_ancestor: false
        }
      ],
      estimated_bridging_weeks: 2,
      estimated_bridging_hours: 14
    },
    feasibility: {
      feasibility_score: 84,
      feasibility_band: "HIGH",
      rule_score: 86,
      ml_completion_probability: 0.84,
      factor_breakdown: [
        {
          factor: "Hardware Compatibility",
          impact: 5,
          status: "PASS",
          explanation: "INT8 ONNX model runs efficiently on local CPU"
        }
      ],
      rules_applied_count: 5
    },
    novelty: {
      novelty_score: 88,
      max_similarity_percentage: 42,
      threshold_percentage: 72,
      is_high_overlap: false,
      status: "NOVEL",
      top_matches: [],
      corpus_size_evaluated: 100
    },
    hireability: {
      hireability_score: 89,
      average_market_frequency: 85,
      top_market_driver: "High demand for edge inference optimization",
      stack_insights: [
        {
          technology: "ONNX Runtime",
          market_demand_frequency: 88,
          market_percentage: 42,
          market_insight: "Strong recruiter demand for CPU model acceleration"
        }
      ],
      source: "Institutional Placements Analytics 2026"
    }
  },
  {
    id: "idea-011",
    title: "AeroSense: Ultra-Low-Power Wildfire Smoke Detection via TinyML Sensor Fusion",
    domain: "Edge AI & TinyML / IoT",
    description: "Off-grid ESP32 sensor node fusing particulate matter (PM2.5) and environmental telemetry with an onboard 12KB neural classifier.",
    required_skills: {
      embedded_c: 4,
      esp32: 4,
      tinyml: 3,
      sensors_protocols: 3,
      mqtt: 3
    },
    typical_timeline_weeks: 14,
    hardware_requirement: "IoT hardware",
    component_count: 4,
    novel_algorithm_required: true,
    tech_stack: ["Embedded C", "ESP32", "TensorFlow Lite Micro", "MQTT", "LoRaWAN"],
    mvp_features: [
      "I2C multi-sensor data acquisition loop",
      "Quantized 12KB CNN model running on ESP32 SRAM",
      "LoRa packet transmitter for long-range telemetry"
    ],
    stretch_features: [
      "Solar energy harvesting power-budget governor",
      "Mesh networking between sibling sensor nodes"
    ],
    combined_score: 85,
    relevance_score: 88,
    domain_similarity_percentage: 92,
    is_domain_match: true,
    skill_coverage: {
      coverage_ratio: 0.90,
      coverage_percentage: 90,
      matched_count: 4,
      total_required: 5,
      gap_severity: 0.10,
      missing_skills: ["sensors_protocols"],
      weak_skills: [],
      gap_breakdown: [],
      topological_learning_pathway: [],
      estimated_bridging_weeks: 1,
      estimated_bridging_hours: 10
    },
    feasibility: {
      feasibility_score: 82,
      feasibility_band: "HIGH",
      rule_score: 84,
      ml_completion_probability: 0.81,
      factor_breakdown: [],
      rules_applied_count: 5
    },
    novelty: {
      novelty_score: 89,
      max_similarity_percentage: 38,
      threshold_percentage: 72,
      is_high_overlap: false,
      status: "NOVEL",
      top_matches: [],
      corpus_size_evaluated: 100
    },
    hireability: {
      hireability_score: 82,
      average_market_frequency: 78,
      top_market_driver: "Surging demand for edge IoT engineers",
      stack_insights: [],
      source: "Institutional Placements Analytics 2026"
    }
  },
  {
    id: "idea-031",
    title: "KernelShield: eBPF Real-Time Container Privilege Escalation Interceptor",
    domain: "Cybersecurity & Threat Intelligence",
    description: "Linux security agent attaching eBPF tracepoints to kernel syscalls to detect and kill processes breaking out of Docker namespaces.",
    required_skills: {
      golang: 3,
      linux_admin: 4,
      docker: 3,
      python: 3
    },
    typical_timeline_weeks: 16,
    hardware_requirement: "CPU-only",
    component_count: 4,
    novel_algorithm_required: true,
    tech_stack: ["Golang", "eBPF / Cilium", "Linux Kernel", "Docker", "Python"],
    mvp_features: [
      "Kernel kprobe and tracepoint bytecode loader",
      "Privilege escalation heuristic scoring engine",
      "Automated process termination via SIGKILL"
    ],
    stretch_features: [
      "Kubernetes DaemonSet deployment Helm chart",
      "MITRE ATT&CK technique tagging matrix"
    ],
    combined_score: 89,
    relevance_score: 91,
    domain_similarity_percentage: 96,
    is_domain_match: true,
    skill_coverage: {
      coverage_ratio: 0.95,
      coverage_percentage: 95,
      matched_count: 4,
      total_required: 4,
      gap_severity: 0.05,
      missing_skills: [],
      weak_skills: [],
      gap_breakdown: [],
      topological_learning_pathway: [],
      estimated_bridging_weeks: 0,
      estimated_bridging_hours: 0
    },
    feasibility: {
      feasibility_score: 75,
      feasibility_band: "MODERATE",
      rule_score: 76,
      ml_completion_probability: 0.74,
      factor_breakdown: [],
      rules_applied_count: 5
    },
    novelty: {
      novelty_score: 95,
      max_similarity_percentage: 28,
      threshold_percentage: 72,
      is_high_overlap: false,
      status: "VERY HIGH NOVELTY",
      top_matches: [],
      corpus_size_evaluated: 100
    },
    hireability: {
      hireability_score: 94,
      average_market_frequency: 93,
      top_market_driver: "Peak DevSecOps & Cloud Security hiring",
      stack_insights: [],
      source: "Institutional Placements Analytics 2026"
    }
  },
  {
    id: "idea-041",
    title: "GraphFraud: Real-Time Anti-Money Laundering via Temporal Graph Neural Networks",
    domain: "FinTech & Fraud Analytics",
    description: "Continuous graph learning engine tracking money laundering transaction rings across 500k bank accounts with dynamic edge time-decay.",
    required_skills: {
      python: 4,
      pytorch: 3,
      postgresql: 3,
      timescaledb: 2,
      sql: 3
    },
    typical_timeline_weeks: 16,
    hardware_requirement: "CPU-only",
    component_count: 5,
    novel_algorithm_required: true,
    tech_stack: ["Python", "PyTorch Geometric", "PostgreSQL", "FastAPI", "React", "D3.js"],
    mvp_features: [
      "Streaming transaction graph ingestion and adjacency updates",
      "TGN dynamic temporal edge weight embedding",
      "Suspicious cyclic flow detection scoring"
    ],
    stretch_features: [
      "3D interactive force-directed graph inspection view",
      "Automated SAR compliance export generation"
    ],
    combined_score: 88,
    relevance_score: 89,
    domain_similarity_percentage: 94,
    is_domain_match: true,
    skill_coverage: {
      coverage_ratio: 0.85,
      coverage_percentage: 85,
      matched_count: 4,
      total_required: 5,
      gap_severity: 0.15,
      missing_skills: ["timescaledb"],
      weak_skills: [],
      gap_breakdown: [],
      topological_learning_pathway: [],
      estimated_bridging_weeks: 2,
      estimated_bridging_hours: 14
    },
    feasibility: {
      feasibility_score: 78,
      feasibility_band: "HIGH",
      rule_score: 80,
      ml_completion_probability: 0.77,
      factor_breakdown: [],
      rules_applied_count: 5
    },
    novelty: {
      novelty_score: 91,
      max_similarity_percentage: 36,
      threshold_percentage: 72,
      is_high_overlap: false,
      status: "NOVEL",
      top_matches: [],
      corpus_size_evaluated: 100
    },
    hireability: {
      hireability_score: 93,
      average_market_frequency: 91,
      top_market_driver: "FinTech quantitative roles",
      stack_insights: [],
      source: "Institutional Placements Analytics 2026"
    }
  }
];
