/* 
   File: project_database_file.js
   Location: /data/
   Description: Centralized 'Database' for CodeCollab. 
   Think of this as your Excel sheet of data.
*/

const globalDatabase = {
    // Project List
    projects: [
        {
            id: 1,
            title: "SwiftTrack Logistics",
            category: "Web",
            tech: ["React", "Node.js", "Leaflet"],
            progress: 65,
            contributors: 12,
            stars: "420",
            github_url: "https://github.com/codecollab/swifttrack",
            description: "A comprehensive open-source delivery tracking system using real-time GPS data. Ideal for fleet management.",
            image: "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: 2,
            title: "EcoPulse AI",
            category: "AI",
            tech: ["Python", "TensorFlow", "D3.js"],
            progress: 40,
            contributors: 8,
            stars: "156",
            github_url: "https://github.com/codecollab/ecopulse",
            description: "AI-powered energy consumption analyzer helping households reduce their carbon footprint.",
            image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: 3,
            title: "SecurePass Vault",
            category: "Security",
            tech: ["Rust", "Solidity", "Tailwind"],
            progress: 85,
            contributors: 15,
            stars: "890",
            github_url: "https://github.com/codecollab/securepass",
            description: "A decentralized password manager using blockchain for immutable security.",
            image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: 4,
            title: "Harmony UI Kit",
            category: "Design",
            tech: ["JavaScript", "CSS", "Figma"],
            progress: 92,
            contributors: 24,
            stars: "1.2k",
            github_url: "https://github.com/codecollab/harmony",
            description: "Community-driven component library focused on accessibility and smooth animations.",
            image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: 5,
            title: "CodeConnect",
            category: "Web",
            tech: ["Socket.io", "React", "MongoDB"],
            progress: 55,
            contributors: 30,
            stars: "560",
            github_url: "https://github.com/codecollab/codeconnect",
            description: "Social platform for pair programming with real-time collaborative editor.",
            image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
        },
        {
            id: 6,
            title: "Nebula OS",
            category: "Systems",
            tech: ["Canvas API", "WebAssembly", "JS"],
            progress: 30,
            contributors: 6,
            stars: "310",
            github_url: "https://github.com/codecollab/nebulaos",
            description: "Lightweight, web-based operating system concept written in modern JS.",
            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800"
        }
    ],

    // Initial Dashboard Data (Requests)
    defaultRequests: [
        { id: 101, project: "SwiftTrack Logistics", date: "2026-04-05", status: "Accepted" },
        { id: 102, project: "EcoPulse AI", date: "2026-04-09", status: "Pending" }
    ],

    // System Config
    appVersion: "1.0.2 - 2026 Edition",
    adminName: "CodeCollab Admin"
};
