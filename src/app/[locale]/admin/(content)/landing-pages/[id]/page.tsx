"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, GripVertical, Trash2, Pencil, Eye, EyeOff, Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/image-uploader";

interface LandingPage {
  id: string;
  slug: string;
  name: string;
  locale: string;
  isPublished: boolean;
  isDefault: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  seoKeywords: string | null;
  sections: LandingSection[];
}

interface LandingSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  styles: any;
  sortOrder: number;
  isActive: boolean;
}

const SECTION_TYPES = [
  { type: "hero", label: "Hero Banner", description: "Main banner with title, subtitle, CTA" },
  { type: "stats", label: "Statistics", description: "Stats bar with numbers" },
  { type: "services", label: "Services", description: "Showcase services" },
  { type: "portfolio", label: "Portfolio", description: "Showcase projects" },
  { type: "features", label: "Features", description: "Feature cards" },
  { type: "testimonials", label: "Testimonials", description: "Customer reviews" },
  { type: "cta", label: "Call to Action", description: "CTA section" },
  { type: "contact", label: "Contact Form", description: "Contact section" },
  { type: "custom", label: "Custom HTML", description: "Custom content" },
];

const emptyHeroContent = {
  title: "",
  subtitle: "",
  ctaPrimaryText: "Liên hệ ngay",
  ctaPrimaryLink: "/contact",
  ctaSecondaryText: "Xem dịch vụ",
  ctaSecondaryLink: "/services",
  backgroundImage: "",
};

const emptyStatsContent = {
  stats: [
    { value: "150+", label: "Dự án" },
    { value: "98%", label: "Khách hàng hài lòng" },
    { value: "50+", label: "Chuyên gia" },
    { value: "8+", label: "Năm kinh nghiệm" },
  ],
};

const emptyCtaContent = {
  title: "Sẵn sàng bắt đầu?",
  description: "Liên hệ ngay để nhận tư vấn miễn phí",
  buttonText: "Liên hệ ngay",
  buttonLink: "/contact",
};

export default function LandingPageEditor({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [pageId, setPageId] = useState<string>("");
  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Section modal
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<LandingSection | null>(null);
  const [sectionType, setSectionType] = useState("hero");
  const [sectionContent, setSectionContent] = useState<any>(emptyHeroContent);

  useEffect(() => {
    params.then((p) => {
      setPageId(p.id);
      fetchPage(p.id);
    });
  }, [params]);

  const fetchPage = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`);
      const json = await res.json();
      if (json.data) {
        setPage(json.data);
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      toast.error("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case "hero": return emptyHeroContent;
      case "stats": return emptyStatsContent;
      case "cta": return emptyCtaContent;
      case "services": return { serviceIds: [] };
      case "portfolio": return { projectIds: [] };
      case "features": return { features: [] };
      case "testimonials": return { testimonialIds: [] };
      case "contact": return { formConfig: {} };
      case "custom": return { htmlContent: "" };
      default: return {};
    }
  };

  const openAddSectionModal = () => {
    setEditingSection(null);
    setSectionType("hero");
    setSectionContent(getDefaultContent("hero"));
    setShowSectionModal(true);
  };

  const openEditSectionModal = (section: LandingSection) => {
    setEditingSection(section);
    setSectionType(section.type);
    setSectionContent(section.content || getDefaultContent(section.type));
    setShowSectionModal(true);
  };

  const handleSaveSection = async () => {
    setSaving(true);
    try {
      const url = editingSection
        ? `/api/admin/landing-pages/${pageId}/sections/${editingSection.id}`
        : `/api/admin/landing-pages/${pageId}/sections`;

      const method = editingSection ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: sectionType,
          content: sectionContent,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save");
      }

      toast.success(editingSection ? "Section updated!" : "Section added!");
      setShowSectionModal(false);
      fetchPage(pageId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section?")) return;

    try {
      const res = await fetch(`/api/admin/landing-pages/${pageId}/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Section deleted!");
        fetchPage(pageId);
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (!page) return;
    const sections = [...page.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);

    const updates = sections.map((s, i) => ({ id: s.id, sortOrder: i }));

    try {
      await fetch(`/api/admin/landing-pages/${pageId}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updates }),
      });
      fetchPage(pageId);
    } catch (error) {
      toast.error("Failed to reorder");
    }
  };

  const toggleSectionActive = async (section: LandingSection) => {
    try {
      await fetch(`/api/admin/landing-pages/${pageId}/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !section.isActive }),
      });
      fetchPage(pageId);
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">Page not found</p>
        <Link href="/admin/landing-pages" className="text-blue-400 hover:underline mt-2 inline-block">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/landing-pages"
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{page.name}</h1>
              <p className="text-sm text-slate-400">/{page.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              page.isPublished ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"
            }`}>
              {page.isPublished ? "Published" : "Draft"}
            </span>
            <Link
              href={`/${page.locale}/${page.slug}`}
              target="_blank"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Preview
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Sections */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Sections</h2>
            <button
              onClick={openAddSectionModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>

          {page.sections.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
              <p className="text-slate-400 mb-4">No sections yet</p>
              <button
                onClick={openAddSectionModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Add your first section
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {page.sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 p-4 bg-slate-900 rounded-xl border transition-colors ${
                    section.isActive ? "border-slate-700" : "border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex flex-col gap-1 text-slate-500">
                    <button
                      disabled={index === 0}
                      onClick={() => handleReorder(index, index - 1)}
                      className="p-1 hover:text-white disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      disabled={index === page.sections.length - 1}
                      onClick={() => handleReorder(index, index + 1)}
                      className="p-1 hover:text-white disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>

                  <div className="w-8 text-center text-sm font-medium text-slate-500">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white capitalize">{section.type}</span>
                      {section.title && (
                        <span className="text-slate-500">- {section.title}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSectionActive(section)}
                    className={`p-2 rounded-lg transition-colors ${
                      section.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                    title={section.isActive ? "Disable" : "Enable"}
                  >
                    {section.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => openEditSectionModal(section)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                {editingSection ? "Edit Section" : "Add Section"}
              </h2>
              <button onClick={() => setShowSectionModal(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!editingSection && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Section Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SECTION_TYPES.map((st) => (
                      <button
                        key={st.type}
                        onClick={() => {
                          setSectionType(st.type);
                          setSectionContent(getDefaultContent(st.type));
                        }}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          sectionType === st.type
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        <div className="font-medium text-white text-sm">{st.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{st.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Editor based on type */}
              {sectionType === "hero" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Title</label>
                    <input
                      type="text"
                      value={sectionContent.title || ""}
                      onChange={(e) => setSectionContent({ ...sectionContent, title: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      placeholder="Tiêu đề Hero"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Subtitle</label>
                    <textarea
                      value={sectionContent.subtitle || ""}
                      onChange={(e) => setSectionContent({ ...sectionContent, subtitle: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      placeholder="Mô tả ngắn"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">Primary CTA Text</label>
                      <input
                        type="text"
                        value={sectionContent.ctaPrimaryText || ""}
                        onChange={(e) => setSectionContent({ ...sectionContent, ctaPrimaryText: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">Primary CTA Link</label>
                      <input
                        type="text"
                        value={sectionContent.ctaPrimaryLink || ""}
                        onChange={(e) => setSectionContent({ ...sectionContent, ctaPrimaryLink: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Background Image</label>
                    <ImageUploader
                      value={sectionContent.backgroundImage || ""}
                      onChange={(url) => setSectionContent({ ...sectionContent, backgroundImage: url })}
                      folder="loop/landing"
                      aspectRatio="landscape"
                    />
                  </div>
                </div>
              )}

              {sectionType === "stats" && (
                <div className="space-y-4">
                  <label className="mb-1 block text-sm font-medium text-slate-300">Stats</label>
                  {(sectionContent.stats || []).map((stat: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => {
                          const newStats = [...(sectionContent.stats || [])];
                          newStats[index] = { ...stat, value: e.target.value };
                          setSectionContent({ ...sectionContent, stats: newStats });
                        }}
                        className="flex-1 h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        placeholder="Value"
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => {
                          const newStats = [...(sectionContent.stats || [])];
                          newStats[index] = { ...stat, label: e.target.value };
                          setSectionContent({ ...sectionContent, stats: newStats });
                        }}
                        className="flex-1 h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        placeholder="Label"
                      />
                      <button
                        onClick={() => {
                          const newStats = (sectionContent.stats || []).filter((_: any, i: number) => i !== index);
                          setSectionContent({ ...sectionContent, stats: newStats });
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSectionContent({
                      ...sectionContent,
                      stats: [...(sectionContent.stats || []), { value: "", label: "" }],
                    })}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="w-4 h-4" /> Add Stat
                  </button>
                </div>
              )}

              {sectionType === "cta" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Title</label>
                    <input
                      type="text"
                      value={sectionContent.title || ""}
                      onChange={(e) => setSectionContent({ ...sectionContent, title: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
                    <textarea
                      value={sectionContent.description || ""}
                      onChange={(e) => setSectionContent({ ...sectionContent, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">Button Text</label>
                      <input
                        type="text"
                        value={sectionContent.buttonText || ""}
                        onChange={(e) => setSectionContent({ ...sectionContent, buttonText: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-300">Button Link</label>
                      <input
                        type="text"
                        value={sectionContent.buttonLink || ""}
                        onChange={(e) => setSectionContent({ ...sectionContent, buttonLink: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {sectionType === "custom" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Custom HTML</label>
                  <textarea
                    value={sectionContent.htmlContent || ""}
                    onChange={(e) => setSectionContent({ ...sectionContent, htmlContent: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                    placeholder="<div>Your custom HTML here</div>"
                  />
                </div>
              )}

              {/* Simple sections that just need title/subtitle */}
              {["services", "portfolio", "features", "testimonials", "contact"].includes(sectionType) && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Title</label>
                    <input
                      type="text"
                      value={sectionContent.title || ""}
                      onChange={(e) => setSectionContent({ ...sectionContent, title: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Subtitle</label>
                    <textarea
                      value={sectionContent.subtitle || ""}
                      onChange={(e) => setSectionContent({ ...sectionContent, subtitle: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSection}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg font-medium"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  Save Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
