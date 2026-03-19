"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ImageUploader } from "@/components/ui/image-uploader";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Play, Image as ImageIcon, Video, GripVertical, LayoutGrid, List, Eye, EyeOff } from "lucide-react";

interface HomeSlider {
  id: string;
  image: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HomeVideo {
  id: string;
  videoUrl: string;
  thumbnail: string | null;
  title: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface SliderForm {
  image: string;
  title: string;
  subtitle: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
}

interface VideoForm {
  videoUrl: string;
  thumbnail: string;
  title: string;
  description: string;
  isActive: boolean;
}

const defaultSliderForm: SliderForm = {
  image: "",
  title: "",
  subtitle: "",
  link: "",
  sortOrder: 0,
  isActive: true,
};

const defaultVideoForm: VideoForm = {
  videoUrl: "",
  thumbnail: "",
  title: "",
  description: "",
  isActive: true,
};

export default function HomeSlidersPage() {
  const [sliders, setSliders] = useState<HomeSlider[]>([]);
  const [video, setVideo] = useState<HomeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Slider form
  const [showSliderForm, setShowSliderForm] = useState(false);
  const [editSlider, setEditSlider] = useState<HomeSlider | null>(null);
  const [sliderForm, setSliderForm] = useState<SliderForm>(defaultSliderForm);
  const [savingSlider, setSavingSlider] = useState(false);
  const [uploadingSlider, setUploadingSlider] = useState(false);

  // Video form
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoForm, setVideoForm] = useState<VideoForm>(defaultVideoForm);
  const [savingVideo, setSavingVideo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch sliders
      const slidersRes = await fetch("/api/admin/home-sliders");
      const slidersData = await slidersRes.json();
      setSliders(slidersData.data || []);

      // Fetch video
      const videoRes = await fetch("/api/admin/home-video");
      const videoData = await videoRes.json();
      if (videoData.data && videoData.data.length > 0) {
        setVideo(videoData.data[0]);
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (draggedItem === null || dragOverItem.current === null || draggedItem === dragOverItem.current) {
      setDraggedItem(null);
      dragOverItem.current = null;
      return;
    }

    const newSliders = [...sliders];
    const draggedSlider = newSliders[draggedItem];
    newSliders.splice(draggedItem, 1);
    newSliders.splice(dragOverItem.current, 0, draggedSlider);

    // Update sort orders
    const updates = newSliders.map((slider, index) => ({
      id: slider.id,
      sortOrder: index,
    }));

    setSliders(newSliders);
    setDraggedItem(null);
    dragOverItem.current = null;

    // Save to server
    try {
      await fetch("/api/admin/home-sliders/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      toast.success("Đã cập nhật thứ tự");
    } catch (e) {
      toast.error("Lỗi cập nhật thứ tự");
      fetchData();
    }
  };

  // Toggle slider active status
  const handleToggleActive = async (slider: HomeSlider) => {
    try {
      const res = await fetch("/api/admin/home-sliders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...slider, isActive: !slider.isActive }),
      });

      if (res.ok) {
        setSliders(sliders.map(s => s.id === slider.id ? { ...s, isActive: !s.isActive } : s));
        toast.success(slider.isActive ? "Đã ẩn slider" : "Đã hiển thị slider");
      } else {
        toast.error("Lỗi cập nhật");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  // Slider handlers
  const handleSaveSlider = async () => {
    if (!sliderForm.image) {
      toast.error("Vui lòng chọn ảnh");
      return;
    }

    setSavingSlider(true);
    try {
      const url = editSlider ? "/api/admin/home-sliders" : "/api/admin/home-sliders";
      const method = editSlider ? "PUT" : "POST";

      const body = editSlider
        ? { ...sliderForm, id: editSlider.id }
        : sliderForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Lỗi lưu slider");
        return;
      }

      toast.success(editSlider ? "Cập nhật thành công" : "Tạo slider thành công");
      setShowSliderForm(false);
      setSliderForm(defaultSliderForm);
      setEditSlider(null);
      fetchData();
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSavingSlider(false);
    }
  };

  const handleEditSlider = (slider: HomeSlider) => {
    setEditSlider(slider);
    setSliderForm({
      image: slider.image,
      title: slider.title || "",
      subtitle: slider.subtitle || "",
      link: slider.link || "",
      sortOrder: slider.sortOrder,
      isActive: slider.isActive,
    });
    setShowSliderForm(true);
  };

  const handleDeleteSlider = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;

    try {
      const res = await fetch(`/api/admin/home-sliders?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Lỗi xóa slider");
        return;
      }
      toast.success("Xóa thành công");
      fetchData();
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  // Video handlers
  const handleSaveVideo = async () => {
    if (!videoForm.videoUrl) {
      toast.error("Vui lòng nhập URL video");
      return;
    }

    setSavingVideo(true);
    try {
      const url = video ? "/api/admin/home-video" : "/api/admin/home-video";
      const method = video ? "PUT" : "POST";

      const body = video
        ? { ...videoForm, id: video.id }
        : videoForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Lỗi lưu video");
        return;
      }

      toast.success("Lưu video thành công");
      setShowVideoForm(false);
      setVideoForm(defaultVideoForm);
      fetchData();
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSavingVideo(false);
    }
  };

  const handleEditVideo = () => {
    if (!video) return;
    setVideoForm({
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail || "",
      title: video.title || "",
      description: video.description || "",
      isActive: video.isActive,
    });
    setShowVideoForm(true);
  };

  const handleDeleteVideo = async () => {
    if (!video || !confirm("Bạn có chắc muốn xóa video?")) return;

    try {
      const res = await fetch(`/api/admin/home-video?id=${video.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Lỗi xóa video");
        return;
      }
      toast.success("Xóa thành công");
      setVideo(null);
      fetchData();
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Home Slider & Video</h1>
          <p className="text-slate-400 mt-1">Quản lý ảnh slider và video marketing cho trang chủ</p>
        </div>
      </div>

      {/* Video Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Video Marketing</h2>
              <p className="text-sm text-slate-400">Video hiển thị bên dưới slider</p>
            </div>
          </div>
          <div className="flex gap-2">
            {video && (
              <button
                onClick={handleEditVideo}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Chỉnh sửa
              </button>
            )}
            {video && (
              <button
                onClick={handleDeleteVideo}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Xóa
              </button>
            )}
            {!video && (
              <button
                onClick={() => {
                  setVideoForm(defaultVideoForm);
                  setShowVideoForm(true);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Thêm Video
              </button>
            )}
          </div>
        </div>

        {/* Current Video Preview */}
        {video && (
          <div className="flex gap-4 p-4 rounded-lg bg-slate-800/50">
            <div className="w-48 h-28 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
              {video.thumbnail ? (
                <img src={video.thumbnail} alt={video.title || "Video"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-slate-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white">{video.title || "Video marketing"}</h3>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{video.description || "Không có mô tả"}</p>
              <p className="text-xs text-slate-500 mt-2 truncate">{video.videoUrl}</p>
            </div>
          </div>
        )}

        {!video && (
          <div className="text-center py-8 text-slate-500">
            Chưa có video nào được cấu hình
          </div>
        )}
      </div>

      {/* Sliders Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Slider Images</h2>
              <p className="text-sm text-slate-400">Danh sách ảnh slider trang chủ ({sliders.length})</p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-slate-800 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Lưới"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Danh sách"
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={() => {
                setSliderForm(defaultSliderForm);
                setEditSlider(null);
                setShowSliderForm(true);
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Thêm Slider
            </button>
          </div>
        </div>

        {/* Sliders Grid/List */}
        {sliders.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sliders.map((slider, index) => (
                <div
                  key={slider.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`group relative rounded-lg overflow-hidden bg-slate-800 cursor-move transition-all ${
                    draggedItem === index ? "opacity-50 scale-95" : ""
                  }`}
                >
                  <div className="aspect-[16/9]">
                    <img src={slider.image} alt={slider.title || "Slider"} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-white text-sm truncate">{slider.title || "Slider"}</h3>
                  </div>
                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                    <div className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400">
                      <GripVertical size={14} />
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleActive(slider)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        slider.isActive
                          ? "bg-slate-900/80 text-green-400 hover:bg-slate-700"
                          : "bg-slate-900/80 text-slate-400 hover:bg-slate-700"
                      }`}
                      title={slider.isActive ? "Ẩn" : "Hiển thị"}
                    >
                      {slider.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => handleEditSlider(slider)}
                      className="p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-700"
                      title="Sửa"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSlider(slider.id)}
                      className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {!slider.isActive && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                      <span className="text-slate-400 text-xs">Đã Ẩn</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sliders.map((slider, index) => (
                <div
                  key={slider.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`flex items-center gap-4 p-3 rounded-lg bg-slate-800 cursor-move transition-all ${
                    draggedItem === index ? "opacity-50" : ""
                  }`}
                >
                  <div className="text-slate-500 hover:text-slate-300">
                    <GripVertical size={20} />
                  </div>
                  <div className="w-32 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                    <img src={slider.image} alt={slider.title || "Slider"} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{slider.title || "Slider"}</h3>
                    <p className="text-sm text-slate-400 truncate">{slider.subtitle || "Không có mô tả"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Thứ tự: {slider.sortOrder}</span>
                    <button
                      onClick={() => handleToggleActive(slider)}
                      className={`p-2 rounded-lg transition-colors ${
                        slider.isActive
                          ? "text-green-400 hover:bg-slate-700"
                          : "text-slate-400 hover:bg-slate-700"
                      }`}
                      title={slider.isActive ? "Ẩn" : "Hiển thị"}
                    >
                      {slider.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => handleEditSlider(slider)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
                      title="Sửa"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteSlider(slider.id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8 text-slate-500">
            Chưa có slider nào. Hãy thêm ảnh đầu tiên!
          </div>
        )}
      </div>

      {/* Slider Form Modal */}
      {showSliderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {editSlider ? "Chỉnh sửa Slider" : "Thêm Slider mới"}
              </h3>
              <button onClick={() => setShowSliderForm(false)} className="p-1 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Ảnh Slider * (khuyến nghị 1920x1080)</label>
                <ImageUploader
                  value={sliderForm.image}
                  onChange={(url) => setSliderForm({ ...sliderForm, image: url })}
                  aspectRatio="landscape"
                  onUploadingChange={(uploading) => setUploadingSlider(uploading)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={sliderForm.title}
                  onChange={(e) => setSliderForm({ ...sliderForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Tiêu đề hiển thị trên slider"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Mô tả ngắn</label>
                <input
                  type="text"
                  value={sliderForm.subtitle}
                  onChange={(e) => setSliderForm({ ...sliderForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Mô tả ngắn"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Link (tùy chọn)</label>
                <input
                  type="text"
                  value={sliderForm.link}
                  onChange={(e) => setSliderForm({ ...sliderForm, link: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="/portfolio, /services, ..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Thứ tự</label>
                  <input
                    type="number"
                    value={sliderForm.sortOrder}
                    onChange={(e) => setSliderForm({ ...sliderForm, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sliderForm.isActive}
                      onChange={(e) => setSliderForm({ ...sliderForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-300">Hiển thị</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
              <button
                onClick={() => setShowSliderForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSlider}
                disabled={savingSlider || uploadingSlider}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingSlider || uploadingSlider ? (uploadingSlider ? "Đang tải ảnh..." : "Đang lưu...") : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Form Modal */}
      {showVideoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {video ? "Chỉnh sửa Video" : "Thêm Video mới"}
              </h3>
              <button onClick={() => setShowVideoForm(false)} className="p-1 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">URL Video *</label>
                <input
                  type="text"
                  value={videoForm.videoUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="https://www.youtube.com/watch?v=... hoặc https://vimeo.com/... hoặc link .mp4"
                />
                <p className="text-xs text-slate-500 mt-1">Hỗ trợ YouTube, Vimeo hoặc file MP4</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Ảnh thumbnail (khuyến nghị 1280x720)</label>
                <ImageUploader
                  value={videoForm.thumbnail}
                  onChange={(url) => setVideoForm({ ...videoForm, thumbnail: url })}
                  aspectRatio="video"
                  onUploadingChange={(uploading) => setUploadingVideo(uploading)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Mô tả</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoForm.isActive}
                    onChange={(e) => setVideoForm({ ...videoForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-300">Hiển thị</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
              <button
                onClick={() => setShowVideoForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveVideo}
                disabled={savingVideo || uploadingVideo}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingVideo || uploadingVideo ? (uploadingVideo ? "Đang tải ảnh..." : "Đang lưu...") : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
