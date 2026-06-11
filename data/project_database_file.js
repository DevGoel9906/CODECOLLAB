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
            title: "SecurePass Vault {DEMO}",
            category: "Security",
            tech: ["Rust", "Solidity", "Tailwind"],
            progress: 85,
            contributors: 15,
            stars: "890",
            github_url: "https://github.com/codecollab/securepass",
            description: "A decentralized password manager using blockchain for immutable security.",
            image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800",
            maintainers: [
                { name: "Dev Goel", github: "https://github.com/devgoel", linkedin: "https://linkedin.com/in/devgoel" }
            ]
        },
        {
            id: 2,
            title: "Harmony UI Kit {DEMO}",
            category: "Design",
            tech: ["JavaScript", "CSS", "Figma"],
            progress: 92,
            contributors: 24,
            stars: "1.2k",
            github_url: "https://github.com/codecollab/harmony",
            description: "Community-driven component library focused on accessibility and smooth animations.",
            image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800",
            maintainers: [
                { name: "John Smith", github: "https://github.com/johnsmith", linkedin: "https://linkedin.com/in/johnsmith" },
                { name: "Alice Doe", github: "https://github.com/alicedoe", linkedin: "https://linkedin.com/in/alicedoe" }
            ]
        },
        {
            id: 3,
            title: "Nebula OS {DEMO}",
            category: "Systems",
            tech: ["Canvas API", "WebAssembly", "JS"],
            progress: 30,
            contributors: 6,
            stars: "310",
            github_url: "https://github.com/codecollab/nebulaos",
            description: "Lightweight, web-based operating system concept written in modern JS.",
            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
            maintainers: [
                { name: "Sarah Lee", github: "https://github.com/sarahlee", linkedin: "https://linkedin.com/in/sarahlee" }
            ]
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
