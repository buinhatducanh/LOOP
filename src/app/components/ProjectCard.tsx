import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";

interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  techStack: string[];
  client: string;
  year: string;
}

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -6, borderColor: "#6366F1", boxShadow: "0 24px 60px rgba(99,102,241,0.15)" }}
      onClick={() => navigate(`/portfolio/${project.id}`)}
      style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", overflow: "hidden", cursor: "pointer", height: "100%" }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
        <motion.img
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5 }}
          src={project.image}
          alt={project.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 50%)" }} />
        {/* Category badge */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          style={{ position: "absolute", top: "12px", left: "12px" }}
        >
          <span style={{ background: "rgba(99,102,241,0.9)", backdropFilter: "blur(10px)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px" }}>
            {project.category}
          </span>
        </motion.div>
        {/* Year badge */}
        <div style={{ position: "absolute", top: "12px", right: "12px" }}>
          <span style={{ background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)", color: "#94A3B8", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 500 }}>
            {project.year}
          </span>
        </div>

        {/* Hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          style={{ position: "absolute", inset: 0, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ background: "white", borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ExternalLink size={20} color="#6366F1" />
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: "4px", color: "#94A3B8", fontSize: "12px", fontWeight: 500 }}>{project.client}</div>
        <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>{project.title}</h3>
        <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.description}
        </p>

        {/* Tech Stack */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
          {project.techStack.slice(0, 4).map((tech) => (
            <motion.span
              key={tech}
              whileHover={{ background: "#374151", color: "#fff" }}
              style={{ background: "#1F2937", color: "#94A3B8", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}
            >
              {tech}
            </motion.span>
          ))}
          {project.techStack.length > 4 && (
            <span style={{ background: "#1F2937", color: "#94A3B8", padding: "3px 10px", borderRadius: "6px", fontSize: "11px" }}>
              +{project.techStack.length - 4}
            </span>
          )}
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ background: "#6366F1", color: "#fff" }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => { e.stopPropagation(); navigate(`/portfolio/${project.id}`); }}
          style={{ width: "100%", background: "transparent", color: "#6366F1", border: "1px solid #6366F1", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          View Case Study <ExternalLink size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
}
