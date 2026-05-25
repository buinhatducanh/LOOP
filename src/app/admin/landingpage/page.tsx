"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
  Layers, Eye, Edit3, Settings, AlertCircle, Sparkles, CheckCircle2,
  ExternalLink, Laptop, RefreshCw, Smartphone, Monitor, Plus, Trash2, Edit,
  Video, TrendingUp, MessageSquare, Globe, Code, Cpu, Palette, Database, Upload,
  Briefcase
} from "lucide-react";
import { DEFAULT_CONTACT_SETTINGS } from "@/lib/constants";

type LandingPageConfig = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "active" | "draft";
  sectionsCount: number;
  lastUpdated: string;
  theme: "Light/Dark Mode" | "Dark Tech Theme";
};

const LANDING_PAGES: LandingPageConfig[] = [
  {
    id: "lp1",
    name: "Landing Page 1 - Corporate Tech",
    slug: "/landing",
    description: "Trang chủ giới thiệu giải pháp doanh nghiệp tiêu chuẩn, hỗ trợ giao diện sáng/tối tự động.",
    status: "draft",
    sectionsCount: 8,
    lastUpdated: "2026-05-10",
    theme: "Light/Dark Mode",
  },
  {
    id: "lp2",
    name: "Landing Page 2 - Creative Tech",
    slug: "/landing2",
    description: "Trang đích công nghệ sáng tạo thế hệ mới với video nền chất lượng cao và giao diện Dark Tech cao cấp.",
    status: "active",
    sectionsCount: 9,
    lastUpdated: "2026-05-18",
    theme: "Dark Tech Theme",
  },
];

const AVAILABLE_ICONS = [
  { name: "Monitor", icon: Monitor, label: "Website" },
  { name: "Video", icon: Video, label: "Media" },
  { name: "TrendingUp", icon: TrendingUp, label: "Marketing" },
  { name: "Layers", icon: Layers, label: "Branding" },
  { name: "Smartphone", icon: Smartphone, label: "App/Mobile" },
  { name: "MessageSquare", icon: MessageSquare, label: "Tư vấn" },
  { name: "Globe", icon: Globe, label: "Mạng lưới" },
  { name: "Code", icon: Code, label: "Lập trình" },
  { name: "Sparkles", icon: Sparkles, label: "Sáng tạo" },
  { name: "Cpu", icon: Cpu, label: "Hạ tầng" },
  { name: "Palette", icon: Palette, label: "Thiết kế" },
  { name: "Database", icon: Database, label: "Database" },
];

export default function LandingPageAdmin() {
  const { t } = useAdminTranslations();
  const [selectedLp, setSelectedLp] = useState<string>("lp2");
  const [activePreviewDevice, setActivePreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSyncing, setIsSyncing] = useState(false);

  // Settings State for Contact Details
  const [settings, setSettings] = useState<Record<string, string>>({ ...DEFAULT_CONTACT_SETTINGS });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Service CRUD State
  const [services, setServices] = useState<any[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    title: "",
    slug: "",
    icon: "Monitor",
    imageUrl: "",
    shortDescription: "",
    longDescription: "",
    category: "Development",
    startingPrice: 5000000,
    deliveryTime: "7 - 14 ngày",
    features: "Responsive, SEO Optimization, Custom UI",
    technologies: "React, Next.js, Node.js",
    isActive: true,
    sortOrder: 1,
  });
  const [isSavingService, setIsSavingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingCtaIndex, setIsUploadingCtaIndex] = useState<number | null>(null);

  // FAQ CRUD State
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isFaqsLoading, setIsFaqsLoading] = useState(true);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [faqFormData, setFaqFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    isActive: true,
    sortOrder: 1,
  });
  const [isSavingFaq, setIsSavingFaq] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  // Project CRUD State
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    title: "",
    slug: "",
    category: "",
    client: "",
    year: new Date().getFullYear().toString(),
    image: "",
    description: "",
    results: "",
    primaryMetric: "",
    isPublished: true,
    sortOrder: 1,
  });
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isUploadingProjectImage, setIsUploadingProjectImage] = useState(false);

  // Portfolio Image CRUD State
  const [portfolioImages, setPortfolioImages] = useState<any[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioFormData, setPortfolioFormData] = useState({
    image: "",
    description: "",
    width: 300,
    row: 1,
    sortOrder: 1,
    isActive: true,
  });
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [isUploadingPortfolioImage, setIsUploadingPortfolioImage] = useState(false);

  const fetchServices = async () => {
    setIsServicesLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const json = await res.json();
      if (json.data) {
        setServices(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setIsServicesLoading(false);
    }
  };

  const fetchFaqs = async () => {
    setIsFaqsLoading(true);
    try {
      const res = await fetch("/api/admin/faq");
      const json = await res.json();
      if (json.data) {
        setFaqs(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch faqs:", err);
    } finally {
      setIsFaqsLoading(false);
    }
  };

  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const res = await fetch("/api/admin/projects?limit=100");
      const json = await res.json();
      if (json.data) {
        setProjects(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 10MB.");
      return;
    }

    setIsUploadingProjectImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "projects");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.data?.url) {
        setProjectFormData(prev => ({
          ...prev,
          image: json.data.url
        }));
      } else {
        alert(json.error || "Tải lên hình ảnh thất bại.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setIsUploadingProjectImage(false);
    }
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProject(true);
    
    const payload = {
      ...projectFormData,
    };

    try {
      const url = editingProjectId ? `/api/admin/projects/${editingProjectId}` : "/api/admin/projects";
      const method = editingProjectId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        setShowProjectForm(false);
        setEditingProjectId(null);
        setProjectFormData({
          title: "",
          slug: "",
          category: "",
          client: "",
          year: new Date().getFullYear().toString(),
          image: "",
          description: "",
          results: "",
          primaryMetric: "",
          isPublished: true,
          sortOrder: 1,
        });
        fetchProjects();
      } else {
        const json = await res.json();
        alert(json.error || "Lưu dự án thất bại.");
      }
    } catch (err) {
      console.error("Save project error:", err);
      alert("Lỗi khi lưu dự án.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleEditProjectClick = (proj: any) => {
    setEditingProjectId(proj.id);
    setProjectFormData({
      title: proj.title || "",
      slug: proj.slug || "",
      category: proj.category || "",
      client: proj.client || "",
      year: proj.year || new Date().getFullYear().toString(),
      image: proj.image || "",
      description: proj.description || "",
      results: proj.results || "",
      primaryMetric: proj.primaryMetric || "",
      isPublished: proj.isPublished !== undefined ? proj.isPublished : true,
      sortOrder: proj.sortOrder || 1,
    });
    setShowProjectForm(true);
    setTimeout(() => {
      document.getElementById("embedded-projects-manager")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dự án này không?")) return;
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProjects();
      } else {
        const json = await res.json();
        alert(json.error || "Xóa dự án thất bại.");
      }
    } catch (err) {
      console.error("Delete project error:", err);
      alert("Lỗi khi xóa dự án.");
    }
  };

  const fetchPortfolioImages = async () => {
    setIsPortfolioLoading(true);
    try {
      const res = await fetch("/api/admin/portfolio-images?limit=100");
      const json = await res.json();
      if (json.data) {
        setPortfolioImages(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch portfolio images:", err);
    } finally {
      setIsPortfolioLoading(false);
    }
  };

  const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 10MB.");
      return;
    }

    setIsUploadingPortfolioImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "portfolio");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.data?.url) {
        setPortfolioFormData(prev => ({
          ...prev,
          image: json.data.url
        }));
      } else {
        alert(json.error || "Tải lên hình ảnh thất bại.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setIsUploadingPortfolioImage(false);
    }
  };

  const handleAddPortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPortfolio(true);

    try {
      const url = editingPortfolioId ? `/api/admin/portfolio-images/${editingPortfolioId}` : "/api/admin/portfolio-images";
      const method = editingPortfolioId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolioFormData),
      });

      if (res.ok) {
        setShowPortfolioForm(false);
        setEditingPortfolioId(null);
        setPortfolioFormData({
          image: "",
          description: "",
          width: 300,
          row: 1,
          sortOrder: 1,
          isActive: true,
        });
        fetchPortfolioImages();
      } else {
        const json = await res.json();
        alert(json.error || "Lưu hình ảnh thất bại.");
      }
    } catch (err) {
      console.error("Save portfolio image error:", err);
      alert("Lỗi khi lưu hình ảnh.");
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleEditPortfolioClick = (img: any) => {
    setEditingPortfolioId(img.id);
    setPortfolioFormData({
      image: img.image || "",
      description: img.description || "",
      width: img.width || 300,
      row: img.row || 1,
      sortOrder: img.sortOrder || 1,
      isActive: img.isActive !== undefined ? img.isActive : true,
    });
    setShowPortfolioForm(true);
    setTimeout(() => {
      document.getElementById("embedded-portfolio-manager")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hình ảnh này không?")) return;
    try {
      const res = await fetch(`/api/admin/portfolio-images/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPortfolioImages();
      } else {
        const json = await res.json();
        alert(json.error || "Xóa hình ảnh thất bại.");
      }
    } catch (err) {
      console.error("Delete portfolio image error:", err);
      alert("Lỗi khi xóa hình ảnh.");
    }
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (json.data && json.data.contact) {
          setSettings((prev) => ({
            ...prev,
            ...json.data.contact,
          }));
        }
      } catch (err) {
        console.error("Failed to load contact settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
    fetchServices();
    fetchFaqs();
    fetchProjects();
    fetchPortfolioImages();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const payload = {
        settings: Object.entries(settings).map(([key, value]) => ({
          key,
          value,
          group: "contact",
        })),
      };
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingService(true);
    
    const payload = {
      ...serviceFormData,
      icon: serviceFormData.imageUrl ? `${serviceFormData.icon}|${serviceFormData.imageUrl}` : serviceFormData.icon,
      features: typeof serviceFormData.features === 'string' ? serviceFormData.features.split(",").map(i => i.trim()).filter(Boolean) : serviceFormData.features,
      technologies: typeof serviceFormData.technologies === 'string' ? serviceFormData.technologies.split(",").map(i => i.trim()).filter(Boolean) : serviceFormData.technologies,
    };
    delete (payload as any).imageUrl;

    try {
      const url = editingServiceId ? `/api/admin/services/${editingServiceId}` : "/api/admin/services";
      const method = editingServiceId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        setShowAddForm(false);
        setEditingServiceId(null);
        fetchServices();
        setServiceFormData({
          title: "", slug: "", icon: "Monitor", imageUrl: "", shortDescription: "", longDescription: "",
          category: "Development", startingPrice: 5000000, deliveryTime: "7 - 14 ngày",
          features: "Responsive, SEO Optimization, Custom UI", technologies: "React, Next.js, Node.js", isActive: true, sortOrder: 1
        });
      } else {
        alert("Có lỗi xảy ra khi lưu dịch vụ.");
      }
    } catch (err) {
      console.error("Failed to save service:", err);
      alert("Lỗi kết nối.");
    } finally {
      setIsSavingService(false);
    }
  };

  const handleEditServiceClick = (svc: any) => {
    let iconName = svc.icon || "Monitor";
    let imageUrl = "";
    if (svc.icon && svc.icon.includes("|")) {
      const parts = svc.icon.split("|");
      iconName = parts[0];
      imageUrl = parts[1];
    } else if (svc.icon && svc.icon.startsWith("http")) {
      iconName = "Monitor";
      imageUrl = svc.icon;
    }

    setEditingServiceId(svc.id);
    setServiceFormData({
      title: svc.title || "",
      slug: svc.slug || "",
      icon: iconName,
      imageUrl: imageUrl,
      shortDescription: svc.shortDescription || "",
      longDescription: svc.longDescription || "",
      category: svc.category || "Development",
      startingPrice: svc.startingPrice || 5000000,
      deliveryTime: svc.deliveryTime || "7 - 14 ngày",
      features: Array.isArray(svc.features) ? svc.features.join(", ") : (svc.features || ""),
      technologies: Array.isArray(svc.technologies) ? svc.technologies.join(", ") : (svc.technologies || ""),
      isActive: svc.isActive ?? true,
      sortOrder: svc.sortOrder ?? 1,
    });
    setShowAddForm(true);
    setTimeout(() => {
      document.getElementById("embedded-services-manager")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 10MB.");
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "services");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.data?.url) {
        setServiceFormData(prev => ({
          ...prev,
          imageUrl: json.data.url
        }));
      } else {
        alert(json.error || "Tải lên hình ảnh thất bại.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dịch vụ này không?")) return;
    
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchServices();
      } else {
        alert("Lỗi khi xóa dịch vụ.");
      }
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  };

  const handleAddFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFaq(true);
    try {
      const url = editingFaqId ? `/api/admin/faq/${editingFaqId}` : "/api/admin/faq";
      const method = editingFaqId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faqFormData),
      });
      if (res.ok) {
        setShowFaqForm(false);
        setEditingFaqId(null);
        fetchFaqs();
        setFaqFormData({
          question: "",
          answer: "",
          category: "general",
          isActive: true,
          sortOrder: 1,
        });
      } else {
        alert("Có lỗi xảy ra khi lưu câu hỏi.");
      }
    } catch (err) {
      console.error("Failed to save FAQ:", err);
      alert("Lỗi kết nối.");
    } finally {
      setIsSavingFaq(false);
    }
  };

  const handleEditFaqClick = (faq: any) => {
    setEditingFaqId(faq.id);
    setFaqFormData({
      question: faq.question || "",
      answer: faq.answer || "",
      category: faq.category || "general",
      isActive: faq.isActive ?? true,
      sortOrder: faq.sortOrder ?? 1,
    });
    setShowFaqForm(true);
    setTimeout(() => {
      document.getElementById("embedded-faqs-manager")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;
    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFaqs();
      } else {
        alert("Lỗi khi xóa câu hỏi.");
      }
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  };

  const handleCtaImageChange = (index: number, value: string) => {
    let current = [
      "https://images.unsplash.com/photo-1641998148499-cb6b55a3c0d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      "https://images.unsplash.com/photo-1758691737278-3af15b37af48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      "https://images.unsplash.com/photo-1764162051223-8c4a22d682c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
    ];
    try {
      if (settings.cta_images) {
        const parsed = JSON.parse(settings.cta_images);
        if (Array.isArray(parsed) && parsed.length === 4) {
          current = parsed;
        }
      }
    } catch(e) {}
    current[index] = value;
    setSettings({ ...settings, cta_images: JSON.stringify(current) });
  };

  const handleCtaImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 10MB.");
      return;
    }

    setIsUploadingCtaIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cta_images");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.data?.url) {
        handleCtaImageChange(index, json.data.url);
      } else {
        alert(json.error || "Tải lên hình ảnh thất bại.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setIsUploadingCtaIndex(null);
    }
  };

  const selectedData = LANDING_PAGES.find(lp => lp.id === selectedLp) || LANDING_PAGES[1];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  return (
    <div style={{ padding: "var(--admin-padding, 2rem)", fontFamily: DS.body }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "4px 8px", borderRadius: 6,
              background: "rgba(107, 61, 245, 0.12)", color: DS.cosmicPurple,
              fontSize: 10, fontWeight: 700, fontFamily: DS.mono,
              letterSpacing: "0.05em",
            }}>
              V4.0 BETA
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: DS.amber, fontSize: 11, fontWeight: 600 }}>
              <Sparkles size={12} />
              <span>Thiết lập hoàn tất</span>
            </div>
          </div>
          <h1 style={{ color: DS.text, fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Quản lý Landing Page
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 4 }}>
            Tùy biến nội dung, cấu trúc phần (sections), video hero nền và cấu hình SEO cho các trang đích.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 18px", borderRadius: 10,
            background: "rgba(255, 255, 255, 0.05)", border: `1px solid ${DS.border}`,
            color: DS.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s ease",
            opacity: isSyncing ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} style={{ animation: isSyncing ? "spin 1s linear infinite" : undefined }} />
          {isSyncing ? "Đang đồng bộ..." : "Đồng bộ bộ nhớ đệm"}
        </button>
      </div>



      {/* Main Workspace Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Left Side: Version Manager & Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>




          {/* Embedded Services Manager to fill the empty space */}
          <div id="embedded-services-manager" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 20, marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ color: DS.text, fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={16} color={DS.cosmicPurple} />
                  Quản lý Dịch vụ CSDL (Hiện lên web)
                </h3>
                <p style={{ color: DS.text4, fontSize: 11, margin: "3px 0 0 0" }}>
                  Thêm hoặc xóa các dịch vụ thực tế hiển thị trên Landing Page.
                </p>
              </div>
              <button
                onClick={() => {
                  if (showAddForm) {
                    setShowAddForm(false);
                    setEditingServiceId(null);
                    setServiceFormData({
                      title: "", slug: "", icon: "Monitor", imageUrl: "", shortDescription: "", longDescription: "",
                      category: "Development", startingPrice: 5000000, deliveryTime: "7 - 14 ngày",
                      features: "Responsive, SEO Optimization, Custom UI", technologies: "React, Next.js, Node.js", isActive: true, sortOrder: 1
                    });
                  } else {
                    setShowAddForm(true);
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "6px 12px", borderRadius: 8,
                  background: showAddForm ? "rgba(255,255,255,0.05)" : GRD.primary,
                  color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Plus size={12} />
                {showAddForm ? (editingServiceId ? "Hủy Chỉnh Sửa" : "Đóng Form") : "Thêm Mới"}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddServiceSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, padding: 14, background: "rgba(0,0,0,0.15)", borderRadius: 10, border: `1px solid ${DS.border}` }}>
                <h4 style={{ color: DS.text, fontSize: 13, fontWeight: 700, margin: "0 0 4px 0" }}>
                  {editingServiceId ? `Đang chỉnh sửa: ${serviceFormData.title}` : "Thêm dịch vụ mới"}
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>TÊN DỊCH VỤ</label>
                    <input required type="text" value={serviceFormData.title} onChange={e => setServiceFormData({...serviceFormData, title: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>SLUG (URL Friendly)</label>
                    <input required type="text" value={serviceFormData.slug} onChange={e => setServiceFormData({...serviceFormData, slug: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="thiet-ke-website" />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>DANH MỤC</label>
                    <input required type="text" value={serviceFormData.category} onChange={e => setServiceFormData({...serviceFormData, category: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>HÌNH NỀN CARD (IMAGE)</label>
                    
                    <div style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: 10, border: `1px solid ${DS.border}`, marginBottom: 6 }}>
                      {serviceFormData.imageUrl ? (
                        <div style={{ position: "relative", width: 90, height: 60, borderRadius: 6, overflow: "hidden", border: `1px solid ${DS.border}`, flexShrink: 0 }}>
                          <img src={serviceFormData.imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button 
                            type="button"
                            onClick={() => setServiceFormData({ ...serviceFormData, imageUrl: "" })}
                            style={{ position: "absolute", top: 2, right: 2, background: "rgba(255,50,50,0.85)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 10, fontWeight: "bold" }}
                            title="Xóa hình"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div style={{ width: 90, height: 60, borderRadius: 6, border: `1px dashed ${DS.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.1)", flexShrink: 0 }}>
                          <Layers size={14} color={DS.text4} />
                          <span style={{ fontSize: 8, color: DS.text4, marginTop: 4 }}>Dùng random</span>
                        </div>
                      )}
                      
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input 
                            id="service-file-upload"
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: "none" }}
                          />
                          <button
                            type="button"
                            disabled={isUploadingImage}
                            onClick={() => document.getElementById("service-file-upload")?.click()}
                            style={{
                              padding: "6px 12px", borderRadius: 6, background: "rgba(107, 61, 245, 0.15)",
                              color: DS.cosmicPurple, border: `1px solid rgba(107, 61, 245, 0.3)`, fontSize: 11, fontWeight: 600,
                              cursor: isUploadingImage ? "not-allowed" : "pointer"
                            }}
                          >
                            {isUploadingImage ? "Đang tải lên..." : "Tải hình từ máy"}
                          </button>
                        </div>
                        <span style={{ fontSize: 9, color: DS.text4 }}>JPG, PNG, WebP tối đa 10MB</span>
                      </div>
                    </div>

                    <input 
                      type="text" 
                      value={serviceFormData.imageUrl} 
                      onChange={e => setServiceFormData({...serviceFormData, imageUrl: e.target.value})} 
                      style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} 
                      placeholder="Hoặc dán URL ảnh trực tiếp tại đây..." 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 6, fontFamily: DS.mono }}>CHỌN ICON ĐẠI DIỆN</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 10, border: `1px solid ${DS.border}` }}>
                    {AVAILABLE_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = serviceFormData.icon === item.name;
                      return (
                        <div
                          key={item.name}
                          onClick={() => setServiceFormData({ ...serviceFormData, icon: item.name })}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            gap: 4, padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                            background: isSelected ? "rgba(107, 61, 245, 0.2)" : "transparent",
                            border: `1px solid ${isSelected ? DS.cosmicPurple : "transparent"}`,
                            transition: "all 0.2s ease",
                          }}
                        >
                          <IconComp size={16} color={isSelected ? DS.cosmicPurple : DS.text3} />
                          <span style={{ fontSize: 9, color: isSelected ? DS.text : DS.text4, textAlign: "center" }}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>MÔ TẢ NGẮN (Thoại hiển thị trên Card)</label>
                  <input required type="text" value={serviceFormData.shortDescription} onChange={e => setServiceFormData({...serviceFormData, shortDescription: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>MÔ TẢ CHI TIẾT</label>
                  <textarea required value={serviceFormData.longDescription} onChange={e => setServiceFormData({...serviceFormData, longDescription: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box", minHeight: 60 }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>THỜI GIAN HOÀN THÀNH</label>
                    <input required type="text" value={serviceFormData.deliveryTime} onChange={e => setServiceFormData({...serviceFormData, deliveryTime: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>GIÁ KHỞI ĐIỂM (VNĐ)</label>
                    <input required type="number" value={serviceFormData.startingPrice} onChange={e => setServiceFormData({...serviceFormData, startingPrice: Number(e.target.value)})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>FEATURES (Phân cách bởi dấu phẩy)</label>
                  <input type="text" value={serviceFormData.features} onChange={e => setServiceFormData({...serviceFormData, features: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>TECHNOLOGIES (Phân cách bởi dấu phẩy)</label>
                  <input type="text" value={serviceFormData.technologies} onChange={e => setServiceFormData({...serviceFormData, technologies: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                </div>

                <button type="submit" disabled={isSavingService} style={{ padding: "8px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: isSavingService ? "not-allowed" : "pointer" }}>
                  {isSavingService ? "Đang lưu..." : (editingServiceId ? "Cập Nhật Dịch Vụ" : "Lưu Dịch Vụ")}
                </button>
              </form>
            )}

            {isServicesLoading ? (
              <div style={{ color: DS.text4, fontSize: 12, textAlign: "center", padding: 20 }}>Đang tải danh sách dịch vụ...</div>
            ) : services.length === 0 ? (
              <div style={{ color: DS.text4, fontSize: 12, textAlign: "center", padding: 20 }}>Chưa có dịch vụ nào trong CSDL.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {services.map((svc) => {
                  let iconName = svc.icon || "Monitor";
                  let imageUrl = "";
                  if (svc.icon && svc.icon.includes("|")) {
                    const parts = svc.icon.split("|");
                    iconName = parts[0];
                    imageUrl = parts[1];
                  } else if (svc.icon && svc.icon.startsWith("http")) {
                    iconName = "Monitor";
                    imageUrl = svc.icon;
                  }

                  return (
                    <div key={svc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: `1px solid ${DS.border}`, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: `1px solid ${DS.border}` }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: `1px solid ${DS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Layers size={16} color={DS.text4} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: DS.text }}>{svc.title}</div>
                          <div style={{ fontSize: 11, color: DS.text4 }}>Danh mục: {svc.category} • Giá từ: {svc.startingPrice.toLocaleString()}đ • Icon: {iconName}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleEditServiceClick(svc)} style={{ padding: "6px 10px", background: "rgba(107, 61, 245, 0.12)", color: DS.cosmicPurple, border: `1px solid rgba(107, 61, 245, 0.15)`, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                          <Edit size={11} /> Sửa
                        </button>
                        <button onClick={() => handleDeleteService(svc.id)} style={{ padding: "6px 10px", background: "rgba(255,50,50,0.1)", color: "#FF5F56", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                          <Trash2 size={11} /> Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Embedded FAQs Manager */}
          <div id="embedded-faqs-manager" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 20, marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ color: DS.text, fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={16} color={DS.cosmicPurple} />
                  Quản lý Câu hỏi thường gặp (FAQ) CSDL
                </h3>
                <p style={{ color: DS.text4, fontSize: 11, margin: "3px 0 0 0" }}>
                  Thêm, sửa hoặc xóa các câu hỏi và câu trả lời hiển thị ở phần FAQ trên Landing Page.
                </p>
              </div>
              <button
                onClick={() => {
                  if (showFaqForm) {
                    setShowFaqForm(false);
                    setEditingFaqId(null);
                    setFaqFormData({
                      question: "",
                      answer: "",
                      category: "general",
                      isActive: true,
                      sortOrder: 1,
                    });
                  } else {
                    setShowFaqForm(true);
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "6px 12px", borderRadius: 8,
                  background: showFaqForm ? "rgba(255,255,255,0.05)" : GRD.primary,
                  color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Plus size={12} />
                {showFaqForm ? (editingFaqId ? "Hủy Chỉnh Sửa" : "Đóng Form") : "Thêm Mới"}
              </button>
            </div>

            {showFaqForm && (
              <form onSubmit={handleAddFaqSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, padding: 14, background: "rgba(0,0,0,0.15)", borderRadius: 10, border: `1px solid ${DS.border}` }}>
                <h4 style={{ color: DS.text, fontSize: 13, fontWeight: 700, margin: "0 0 4px 0" }}>
                  {editingFaqId ? `Đang chỉnh sửa câu hỏi` : "Thêm câu hỏi mới"}
                </h4>
                
                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>CÂU HỎI (QUESTION)</label>
                  <input required type="text" value={faqFormData.question} onChange={e => setFaqFormData({...faqFormData, question: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="Ví dụ: LOOPS cung cấp những dịch vụ gì?" />
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>CÂU TRẢ LỜI (ANSWER)</label>
                  <textarea required value={faqFormData.answer} onChange={e => setFaqFormData({...faqFormData, answer: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box", minHeight: 80 }} placeholder="Nhập câu trả lời chi tiết..." />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>DANH MỤC (CATEGORY)</label>
                    <input required type="text" value={faqFormData.category} onChange={e => setFaqFormData({...faqFormData, category: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="general" />
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>THỨ TỰ SẮP XẾP (SORT ORDER)</label>
                    <input required type="number" value={faqFormData.sortOrder} onChange={e => setFaqFormData({...faqFormData, sortOrder: Number(e.target.value)})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="faq-isActive" checked={faqFormData.isActive} onChange={e => setFaqFormData({...faqFormData, isActive: e.target.checked})} style={{ width: 14, height: 14, cursor: "pointer" }} />
                  <label htmlFor="faq-isActive" style={{ color: DS.text2, fontSize: 12, cursor: "pointer", userSelect: "none" }}>Kích hoạt (Hiển thị ra ngoài web)</label>
                </div>

                <button type="submit" disabled={isSavingFaq} style={{ padding: "8px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: isSavingFaq ? "not-allowed" : "pointer", marginTop: 4 }}>
                  {isSavingFaq ? "Đang lưu..." : (editingFaqId ? "Cập Nhật Câu Hỏi" : "Lưu Câu Hỏi")}
                </button>
              </form>
            )}

            {isFaqsLoading ? (
              <div style={{ color: DS.text4, fontSize: 12, textAlign: "center", padding: 20 }}>Đang tải danh sách câu hỏi...</div>
            ) : faqs.length === 0 ? (
              <div style={{ color: DS.text4, fontSize: 12, textAlign: "center", padding: 20 }}>Chưa có câu hỏi nào trong CSDL.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "480px", overflowY: "auto", paddingRight: "6px" }}>
                {faqs.map((faq) => (
                  <div key={faq.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.02)", border: `1px solid ${DS.border}`, borderRadius: 10, gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(107, 61, 245, 0.12)", color: DS.cosmicPurple, fontFamily: DS.mono }}>
                          Order: {faq.sortOrder}
                        </span>
                        {!faq.isActive && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(239, 68, 68, 0.12)", color: "#FF5F56", fontFamily: DS.mono }}>
                            ẨN
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: DS.text4 }}>Danh mục: {faq.category}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: DS.text, marginBottom: 2 }}>Q: {faq.question}</div>
                      <div style={{ fontSize: 12, color: DS.text4, lineHeight: 1.4 }}>A: {faq.answer}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleEditFaqClick(faq)} style={{ padding: "6px 10px", background: "rgba(107, 61, 245, 0.12)", color: DS.cosmicPurple, border: `1px solid rgba(107, 61, 245, 0.15)`, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Edit size={11} /> Sửa
                      </button>
                      <button onClick={() => handleDeleteFaq(faq.id)} style={{ padding: "6px 10px", background: "rgba(255,50,50,0.1)", color: "#FF5F56", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Trash2 size={11} /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Embedded Projects Manager */}
          <div id="embedded-projects-manager" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 20, marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ color: DS.text, fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Briefcase size={16} color={DS.cosmicPurple} />
                  Quản lý Dự án tiêu biểu CSDL
                </h3>
                <p style={{ color: DS.text4, fontSize: 11, margin: "3px 0 0 0" }}>
                  Thêm, sửa hoặc xóa các dự án nổi bật hiển thị ở phần Portfolio/Dự án trên Landing Page.
                </p>
              </div>
              <button
                onClick={() => {
                  if (showProjectForm) {
                    setShowProjectForm(false);
                    setEditingProjectId(null);
                    setProjectFormData({
                      title: "",
                      slug: "",
                      category: "",
                      client: "",
                      year: new Date().getFullYear().toString(),
                      image: "",
                      description: "",
                      results: "",
                      primaryMetric: "",
                      isPublished: true,
                      sortOrder: 1,
                    });
                  } else {
                    setShowProjectForm(true);
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "6px 12px", borderRadius: 8,
                  background: showProjectForm ? "rgba(255,255,255,0.05)" : GRD.primary,
                  color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Plus size={12} />
                {showProjectForm ? (editingProjectId ? "Hủy Chỉnh Sửa" : "Đóng Form") : "Thêm Mới"}
              </button>
            </div>

            {showProjectForm && (
              <form onSubmit={handleAddProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, padding: 14, background: "rgba(0,0,0,0.15)", borderRadius: 10, border: `1px solid ${DS.border}` }}>
                <h4 style={{ color: DS.text, fontSize: 13, fontWeight: 700, margin: "0 0 4px 0" }}>
                  {editingProjectId ? `Đang chỉnh sửa dự án` : "Thêm dự án mới"}
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>TIÊU ĐỀ DỰ ÁN</label>
                    <input required type="text" value={projectFormData.title} onChange={e => setProjectFormData({...projectFormData, title: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="Ví dụ: Dự án Tái định vị Thương hiệu The Coffee House" />
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>SLUG (URL Friendly)</label>
                    <input required type="text" value={projectFormData.slug} onChange={e => setProjectFormData({...projectFormData, slug: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="the-coffee-house" />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>TÊN KHÁCH HÀNG / WEBSITE</label>
                    <input required type="text" value={projectFormData.client} onChange={e => setProjectFormData({...projectFormData, client: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="The Coffee House" />
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>DANH MỤC / LOẠI WEBSITE</label>
                    <input required type="text" value={projectFormData.category} onChange={e => setProjectFormData({...projectFormData, category: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="Website Design + E-commerce" />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>NĂM THỰC HIỆN</label>
                    <input required type="text" value={projectFormData.year} onChange={e => setProjectFormData({...projectFormData, year: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="2024" />
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>THỬ TỰ SẮP XẾP</label>
                    <input required type="number" value={projectFormData.sortOrder} onChange={e => setProjectFormData({...projectFormData, sortOrder: Number(e.target.value)})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>CHỈ SỐ CHÍNH (PRIMARY METRIC)</label>
                    <input required type="text" value={projectFormData.primaryMetric} onChange={e => setProjectFormData({...projectFormData, primaryMetric: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="Ví dụ: +240% hoặc 15M" />
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>KẾT QUẢ HIỂN THỊ (RESULTS)</label>
                    <input required type="text" value={projectFormData.results} onChange={e => setProjectFormData({...projectFormData, results: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="Ví dụ: +240% Conversion hoặc 15M Lượt tiếp cận" />
                  </div>
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>HÌNH ẢNH DỰ ÁN</label>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: 10, border: `1px solid ${DS.border}`, marginBottom: 6 }}>
                    {projectFormData.image ? (
                      <div style={{ position: "relative", width: 90, height: 60, borderRadius: 6, overflow: "hidden", border: `1px solid ${DS.border}`, flexShrink: 0 }}>
                        <img src={projectFormData.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button 
                          type="button"
                          onClick={() => setProjectFormData({ ...projectFormData, image: "" })}
                          style={{ position: "absolute", top: 2, right: 2, background: "rgba(255,50,50,0.85)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 10, fontWeight: "bold" }}
                          title="Xóa hình"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: 90, height: 60, borderRadius: 6, border: `1px dashed ${DS.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.1)", flexShrink: 0 }}>
                        <Briefcase size={14} color={DS.text4} />
                        <span style={{ fontSize: 8, color: DS.text4, marginTop: 4 }}>Chưa có ảnh</span>
                      </div>
                    )}
                    
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input 
                          id="project-file-upload"
                          type="file" 
                          accept="image/*"
                          onChange={handleProjectImageUpload}
                          style={{ display: "none" }}
                        />
                        <button
                          type="button"
                          disabled={isUploadingProjectImage}
                          onClick={() => document.getElementById("project-file-upload")?.click()}
                          style={{
                            padding: "6px 12px", borderRadius: 6, background: "rgba(107, 61, 245, 0.15)",
                            color: DS.cosmicPurple, border: `1px solid rgba(107, 61, 245, 0.3)`, fontSize: 11, fontWeight: 600,
                            cursor: isUploadingProjectImage ? "not-allowed" : "pointer"
                          }}
                        >
                          {isUploadingProjectImage ? "Đang tải lên..." : "Tải hình từ máy"}
                        </button>
                      </div>
                      <span style={{ fontSize: 9, color: DS.text4 }}>JPG, PNG, WebP tối đa 10MB</span>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={projectFormData.image} 
                    onChange={e => setProjectFormData({...projectFormData, image: e.target.value})} 
                    style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} 
                    placeholder="Hoặc dán URL ảnh trực tiếp..." 
                  />
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>MÔ TẢ NGẮN DỰ ÁN</label>
                  <textarea required value={projectFormData.description} onChange={e => setProjectFormData({...projectFormData, description: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box", minHeight: 60 }} placeholder="Nhập mô tả dự án..." />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="project-isPublished" checked={projectFormData.isPublished} onChange={e => setProjectFormData({...projectFormData, isPublished: e.target.checked})} style={{ width: 14, height: 14, cursor: "pointer" }} />
                  <label htmlFor="project-isPublished" style={{ color: DS.text2, fontSize: 12, cursor: "pointer", userSelect: "none" }}>Kích hoạt (Hiển thị ra ngoài web)</label>
                </div>

                <button type="submit" disabled={isSavingProject} style={{ padding: "8px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: isSavingProject ? "not-allowed" : "pointer", marginTop: 4 }}>
                  {isSavingProject ? "Đang lưu..." : (editingProjectId ? "Cập Nhật Dự Án" : "Lưu Dự Án")}
                </button>
              </form>
            )}

            {isProjectsLoading ? (
              <div style={{ color: DS.text4, fontSize: 12, textAlign: "center", padding: 20 }}>Đang tải danh sách dự án...</div>
            ) : projects.length === 0 ? (
              <div style={{ color: DS.text4, fontSize: 12, textAlign: "center", padding: 20 }}>Chưa có dự án nào trong CSDL.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "480px", overflowY: "auto", paddingRight: "6px" }}>
                {projects.map((proj) => (
                  <div key={proj.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: `1px solid ${DS.border}`, borderRadius: 10, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      {proj.image ? (
                        <img src={proj.image} alt="" style={{ width: 50, height: 40, borderRadius: 6, objectFit: "cover", border: `1px solid ${DS.border}`, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 50, height: 40, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: `1px solid ${DS.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Briefcase size={16} color={DS.text4} />
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 4, background: "rgba(107, 61, 245, 0.12)", color: DS.cosmicPurple, fontFamily: DS.mono }}>
                            Order: {proj.sortOrder}
                          </span>
                          {!proj.isPublished && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 4, background: "rgba(239, 68, 68, 0.12)", color: "#FF5F56", fontFamily: DS.mono }}>
                              ẨN
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: DS.text4, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{proj.category} • {proj.year}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: DS.text, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{proj.client}</div>
                        <div style={{ fontSize: 11, color: DS.text3, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Chỉ số: <span style={{ color: DS.cosmicPurple, fontWeight: 600 }}>{proj.primaryMetric}</span> ({proj.results})</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleEditProjectClick(proj)} style={{ padding: "6px 10px", background: "rgba(107, 61, 245, 0.12)", color: DS.cosmicPurple, border: `1px solid rgba(107, 61, 245, 0.15)`, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Edit size={11} /> Sửa
                      </button>
                      <button onClick={() => handleDeleteProject(proj.id)} style={{ padding: "6px 10px", background: "rgba(255,50,50,0.1)", color: "#FF5F56", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Trash2 size={11} /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Embedded Portfolio Marquee Images Manager */}
          <div id="embedded-portfolio-manager" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 20, marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ color: DS.text, fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Briefcase size={16} color={DS.cosmicPurple} />
                  Quản lý Ảnh Marquee Portfolio (Dải ảnh trượt)
                </h3>
                <p style={{ color: DS.text4, fontSize: 11, margin: "3px 0 0 0" }}>
                  Quản lý danh sách hình ảnh, mô tả và chiều rộng so le trong dải ảnh cuộn ngang động của Landing Page 2.
                </p>
              </div>
              <button
                onClick={() => {
                  if (showPortfolioForm) {
                    setShowPortfolioForm(false);
                    setEditingPortfolioId(null);
                    setPortfolioFormData({
                      image: "",
                      description: "",
                      width: 300,
                      row: 1,
                      sortOrder: 1,
                      isActive: true,
                    });
                  } else {
                    setShowPortfolioForm(true);
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "6px 12px", borderRadius: 8,
                  background: showPortfolioForm ? "rgba(255,255,255,0.05)" : GRD.primary,
                  color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Plus size={12} />
                {showPortfolioForm ? (editingPortfolioId ? "Hủy Chỉnh Sửa" : "Đóng Form") : "Thêm Mới"}
              </button>
            </div>

            {showPortfolioForm && (
              <form onSubmit={handleAddPortfolioSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, padding: 14, background: "rgba(0,0,0,0.15)", borderRadius: 10, border: `1px solid ${DS.border}` }}>
                <h4 style={{ color: DS.text, fontSize: 13, fontWeight: 700, margin: "0 0 4px 0" }}>
                  {editingPortfolioId ? "Cập nhật hình ảnh Portfolio" : "Thêm ảnh Portfolio mới"}
                </h4>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>HÌNH ẢNH PORTFOLIO</label>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: 10, border: `1px solid ${DS.border}`, marginBottom: 6 }}>
                    {portfolioFormData.image ? (
                      <div style={{ position: "relative", width: 90, height: 60, borderRadius: 6, overflow: "hidden", border: `1px solid ${DS.border}`, flexShrink: 0 }}>
                        <img src={portfolioFormData.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button 
                          type="button"
                          onClick={() => setPortfolioFormData({ ...portfolioFormData, image: "" })}
                          style={{ position: "absolute", top: 2, right: 2, background: "rgba(255,50,50,0.85)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 10, fontWeight: "bold" }}
                          title="Xóa hình"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: 90, height: 60, borderRadius: 6, border: `1px dashed ${DS.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.1)", flexShrink: 0 }}>
                        <Briefcase size={14} color={DS.text4} />
                        <span style={{ fontSize: 8, color: DS.text4, marginTop: 4 }}>Chưa có ảnh</span>
                      </div>
                    )}
                    
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input 
                          id="portfolio-file-upload"
                          type="file" 
                          accept="image/*"
                          onChange={handlePortfolioImageUpload}
                          style={{ display: "none" }}
                        />
                        <button
                          type="button"
                          disabled={isUploadingPortfolioImage}
                          onClick={() => document.getElementById("portfolio-file-upload")?.click()}
                          style={{
                            padding: "6px 12px", borderRadius: 6, background: "rgba(107, 61, 245, 0.15)",
                            color: DS.cosmicPurple, border: `1px solid rgba(107, 61, 245, 0.3)`, fontSize: 11, fontWeight: 600,
                            cursor: isUploadingPortfolioImage ? "not-allowed" : "pointer"
                          }}
                        >
                          {isUploadingPortfolioImage ? "Đang tải lên..." : "Tải hình từ máy"}
                        </button>
                      </div>
                      <span style={{ fontSize: 9, color: DS.text4 }}>JPG, PNG, WebP tối đa 10MB</span>
                    </div>
                  </div>
                  <input 
                    required
                    type="text" 
                    value={portfolioFormData.image} 
                    onChange={e => setPortfolioFormData({...portfolioFormData, image: e.target.value})} 
                    style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} 
                    placeholder="Hoặc dán URL ảnh trực tiếp..." 
                  />
                </div>

                <div>
                  <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>MÔ TẢ (Hover Label)</label>
                  <input required type="text" value={portfolioFormData.description} onChange={e => setPortfolioFormData({...portfolioFormData, description: e.target.value})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} placeholder="Ví dụ: Strategy Session hoặc Mobile App..." />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>HÀNG HIỂN THỊ (ROW)</label>
                    <select value={portfolioFormData.row} onChange={e => setPortfolioFormData({...portfolioFormData, row: Number(e.target.value)})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }}>
                      <option value={1} style={{ background: "#1a1a1a" }}>Hàng trên (Row 1)</option>
                      <option value={2} style={{ background: "#1a1a1a" }}>Hàng dưới (Row 2)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>CHIỀU RỘNG (WIDTH - PX)</label>
                    <input required type="number" value={portfolioFormData.width} onChange={e => setPortfolioFormData({...portfolioFormData, width: Number(e.target.value)})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 4, fontFamily: DS.mono }}>THỨ TỰ SẮP XẾP</label>
                    <input required type="number" value={portfolioFormData.sortOrder} onChange={e => setPortfolioFormData({...portfolioFormData, sortOrder: Number(e.target.value)})} style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, color: DS.text, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%", paddingTop: 20, boxSizing: "border-box" }}>
                    <input type="checkbox" id="portfolio-isActive" checked={portfolioFormData.isActive} onChange={e => setPortfolioFormData({...portfolioFormData, isActive: e.target.checked})} style={{ width: 14, height: 14, cursor: "pointer" }} />
                    <label htmlFor="portfolio-isActive" style={{ color: DS.text2, fontSize: 12, cursor: "pointer", userSelect: "none" }}>Kích hoạt hiển thị</label>
                  </div>
                </div>

                <button type="submit" disabled={isSavingPortfolio} style={{ padding: "8px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: isSavingPortfolio ? "not-allowed" : "pointer", marginTop: 4 }}>
                  {isSavingPortfolio ? "Đang lưu..." : (editingPortfolioId ? "Cập Nhật Hình Ảnh" : "Lưu Hình Ảnh")}
                </button>
              </form>
            )}

            {isPortfolioLoading ? (
              <div style={{ color: DS.text4, fontSize: 12, textAlign: "center", padding: 20 }}>Đang tải danh sách hình ảnh...</div>
            ) : portfolioImages.length === 0 ? (
              <div style={{ color: DS.text4, fontSize: 12, textAlign: "center", padding: 20 }}>Chưa có hình ảnh nào trong CSDL.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "400px", overflowY: "auto", paddingRight: "6px" }}>
                {portfolioImages.map((img) => (
                  <div key={img.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: `1px solid ${DS.border}`, borderRadius: 10, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <img src={img.image} alt="" style={{ width: 50, height: 40, borderRadius: 6, objectFit: "cover", border: `1px solid ${DS.border}`, flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 4, background: "rgba(107, 61, 245, 0.12)", color: DS.cosmicPurple, fontFamily: DS.mono }}>
                            Hàng {img.row} • Order: {img.sortOrder}
                          </span>
                          {!img.isActive && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 4, background: "rgba(239, 68, 68, 0.12)", color: "#FF5F56", fontFamily: DS.mono }}>
                              ẨN
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: DS.text4 }}>Rộng: {img.width}px</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: DS.text, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{img.description}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => handleEditPortfolioClick(img)} style={{ padding: "6px 10px", background: "rgba(107, 61, 245, 0.12)", color: DS.cosmicPurple, border: `1px solid rgba(107, 61, 245, 0.15)`, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Edit size={11} /> Sửa
                      </button>
                      <button onClick={() => handleDeletePortfolio(img.id)} style={{ padding: "6px 10px", background: "rgba(255,50,50,0.1)", color: "#FF5F56", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                        <Trash2 size={11} /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Panel & SEO Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>


          {/* Contact Information Config Card */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ color: DS.text, fontSize: 15, fontWeight: 700, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <Settings size={16} color={DS.cosmicPurple} />
              Thông tin liên hệ Landing Page
            </h3>
            <p style={{ color: DS.text4, fontSize: 11, margin: "-8px 0 16px 0" }}>
              Thay đổi thông tin liên hệ hiển thị ở Navbar, Footer và nút liên hệ nổi của Landing Page 2.
            </p>

            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>HOTLINE</label>
                <input
                  type="text"
                  value={settings.contact_hotline}
                  onChange={(e) => setSettings({ ...settings, contact_hotline: e.target.value })}
                  style={{
                    width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${DS.border}`, borderRadius: 8,
                    fontSize: 12, color: DS.text2, outline: "none", boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>EMAIL</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  style={{
                    width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${DS.border}`, borderRadius: 8,
                    fontSize: 12, color: DS.text2, outline: "none", boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>ĐỊA CHỈ</label>
                <input
                  type="text"
                  value={settings.contact_address}
                  onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                  style={{
                    width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${DS.border}`, borderRadius: 8,
                    fontSize: 12, color: DS.text2, outline: "none", boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>GIỜ LÀM VIỆC</label>
                <input
                  type="text"
                  value={settings.contact_hours}
                  onChange={(e) => setSettings({ ...settings, contact_hours: e.target.value })}
                  style={{
                    width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${DS.border}`, borderRadius: 8,
                    fontSize: 12, color: DS.text2, outline: "none", boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>ĐƯỜNG DẪN ZALO</label>
                <input
                  type="text"
                  value={settings.contact_zalo}
                  onChange={(e) => setSettings({ ...settings, contact_zalo: e.target.value })}
                  style={{
                    width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${DS.border}`, borderRadius: 8,
                    fontSize: 12, color: DS.text2, outline: "none", boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>ĐƯỜNG DẪN FACEBOOK</label>
                <input
                  type="text"
                  value={settings.contact_facebook}
                  onChange={(e) => setSettings({ ...settings, contact_facebook: e.target.value })}
                  style={{
                    width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${DS.border}`, borderRadius: 8,
                    fontSize: 12, color: DS.text2, outline: "none", boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  width: "100%", padding: "10px", borderRadius: 8,
                  background: GRD.primary, color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer",
                  marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "opacity 0.2s ease",
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>

              {saveStatus === "success" && (
                <div style={{ color: DS.green, fontSize: 12, textAlign: "center", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <CheckCircle2 size={14} />
                  <span>Đã lưu cấu hình thành công!</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div style={{ color: DS.red, fontSize: 12, textAlign: "center", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <AlertCircle size={14} />
                  <span>Lỗi lưu cấu hình, vui lòng thử lại!</span>
                </div>
              )}
            </form>
          </div>

          {/* CTA Corner Images Config Card */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ color: DS.text, fontSize: 15, fontWeight: 700, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <Palette size={16} color={DS.cosmicPurple} />
              Cấu hình 4 hình ảnh góc CTA Banner
            </h3>
            <p style={{ color: DS.text4, fontSize: 11, margin: "-8px 0 16px 0" }}>
              Thay đổi 4 hình ảnh trang trí hiển thị ở 4 góc của phần kêu gọi hành động (CTA) "Sẵn sàng bứt phá cùng LOOPS?".
            </p>

            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(() => {
                let currentCtaImages = [
                  "https://images.unsplash.com/photo-1641998148499-cb6b55a3c0d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
                  "https://images.unsplash.com/photo-1758691737278-3af15b37af48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
                  "https://images.unsplash.com/photo-1764162051223-8c4a22d682c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                ];
                try {
                  if (settings.cta_images) {
                    const parsed = JSON.parse(settings.cta_images);
                    if (Array.isArray(parsed) && parsed.length === 4) {
                      currentCtaImages = parsed;
                    }
                  }
                } catch(e) {}

                return [
                  { label: "ẢNH GÓC TRÊN - BÊN TRÁI (TOP-LEFT)", index: 0 },
                  { label: "ẢNH GÓC TRÊN - BÊN PHẢI (TOP-RIGHT)", index: 1 },
                  { label: "ẢNH GÓC DƯỚI - BÊN TRÁI (BOTTOM-LEFT)", index: 2 },
                  { label: "ẢNH GÓC DƯỚI - BÊN PHẢI (BOTTOM-RIGHT)", index: 3 }
                ].map((slot) => {
                  const imgUrl = currentCtaImages[slot.index];
                  const isUploadingThis = isUploadingCtaIndex === slot.index;

                  return (
                    <div key={slot.index} style={{ borderBottom: slot.index < 3 ? `1px solid rgba(255,255,255,0.04)` : "none", paddingBottom: slot.index < 3 ? 16 : 0 }}>
                      <label style={{ color: DS.text4, fontSize: 10, display: "block", marginBottom: 6, fontFamily: DS.mono, fontWeight: 700 }}>
                        {slot.label}
                      </label>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 70, height: 50, borderRadius: 8, background: "rgba(0,0,0,0.4)", border: `1px solid ${DS.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {imgUrl ? (
                            <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: 9, color: DS.text4 }}>No Image</span>
                          )}
                        </div>
                        
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                          <input
                            type="text"
                            value={imgUrl}
                            onChange={(e) => handleCtaImageChange(slot.index, e.target.value)}
                            placeholder="Đường dẫn ảnh (URL)..."
                            style={{
                              width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.2)",
                              border: `1px solid ${DS.border}`, borderRadius: 6,
                              fontSize: 11, color: DS.text2, outline: "none", boxSizing: "border-box"
                            }}
                          />
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <label style={{
                              padding: "4px 10px", borderRadius: 6,
                              background: isUploadingThis ? "rgba(255,255,255,0.05)" : "rgba(107, 61, 245, 0.12)",
                              color: isUploadingThis ? DS.text4 : DS.cosmicPurple,
                              border: `1px solid rgba(107, 61, 245, 0.15)`,
                              fontSize: 10, fontWeight: 600, cursor: isUploadingThis ? "not-allowed" : "pointer",
                              display: "flex", alignItems: "center", gap: 4
                            }}>
                              <Upload size={10} />
                              {isUploadingThis ? "Đang tải lên..." : "Tải ảnh lên"}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingThis}
                                onChange={(e) => handleCtaImageUpload(slot.index, e)}
                                style={{ display: "none" }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  width: "100%", padding: "10px", borderRadius: 8,
                  background: GRD.primary, color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer",
                  marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "opacity 0.2s ease",
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? "Đang lưu..." : "Lưu 4 hình ảnh CTA"}
              </button>

              {saveStatus === "success" && (
                <div style={{ color: DS.green, fontSize: 12, textAlign: "center", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <CheckCircle2 size={14} />
                  <span>Đã lưu thành công!</span>
                </div>
              )}
            </form>
          </div>

          {/* SEO & Video Assets Config */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ color: DS.text, fontSize: 15, fontWeight: 700, margin: "0 0 12px 0" }}>
              Cấu hình Video & SEO
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <span style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 4, fontFamily: DS.mono }}>URL VIDEO BẢN GỐC</span>
                <div style={{
                  padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${DS.border}`, borderRadius: 8,
                  fontSize: 12, color: DS.text2, fontFamily: DS.mono,
                  wordBreak: "break-all",
                }}>
                  /assets/video.mp4
                </div>
              </div>

              <div>
                <span style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 4, fontFamily: DS.mono }}>META TITLE</span>
                <div style={{
                  padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${DS.border}`, borderRadius: 8,
                  fontSize: 12, color: DS.text2,
                }}>
                  LOOP Solutions — Creative Web & High Tech Agency
                </div>
              </div>

              <div>
                <span style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 4, fontFamily: DS.mono }}>CANONICAL URL</span>
                <div style={{
                  padding: "8px 10px", background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${DS.border}`, borderRadius: 8,
                  fontSize: 12, color: DS.cosmicBlue, fontFamily: DS.mono,
                }}>
                  https://loop.solutions/landing2
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
