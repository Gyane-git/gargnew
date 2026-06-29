"use client";
import React, { useState, useEffect } from "react";
import {  Plus, Edit2, Trash2, ImageIcon } from "lucide-react";

const API_URL = "/api/popup-ads";

export default function PopupAdsAdmin() {
  const [ads, setAds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    color: "#000000",
    isActive: true,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      const parsedAds = data.map((item) => ({
        id: item.id,
        title: item.title || "Untitled Ad",
        color: item.color || "#000000",
        isActive: !!item.isActive,
      }));

      setAds(parsedAds);
    } catch (err) {
      console.error("Failed to fetch ads:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title) {
      alert("Please enter the ad title");
      return;
    }

    const adPayload = {
      title: formData.title,
      color: formData.color,
    };

    try {
      if (editingAd) {
        await fetch(API_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAd.id,
            ads: [adPayload],
            is_active: formData.isActive ? 1 : 0,
          }),
        });
      } else {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ads: [adPayload],
            is_active: formData.isActive ? 1 : 0,
          }),
        });
      }

      fetchAds();
      resetForm();
    } catch (err) {
      console.error("Failed to save ad:", err);
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      color: ad.color || "#000000",
      isActive: ad.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this ad?")) {
      try {
        await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
        fetchAds();
      } catch (err) {
        console.error("Failed to delete ad:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: "", color: "#000000", isActive: true });
    setEditingAd(null);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* TOP HEADER WITH ADD BUTTON */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 " >Popup Ads Manager</h2>

          <button
            onClick={() => {
              setEditingAd(null);
              setFormData({ title: "", color: "#000000", isActive: true });
              setShowModal(true);
            }}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} /> Add New Ad
          </button>
        </div>

        {/* Ads List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-linear-to-r from-slate-700 to-slate-800 px-8 py-4">
            <h2 className="text-xl font-semibold text-white">Active Popup Ads</h2>
          </div>

          <div className="p-6">
            {ads.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">
                  No popup ads yet. Create your first one!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex items-center gap-6 p-5 bg-linear-to-r from-slate-50 to-white border border-slate-200 rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="grow min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: ad.color }}
                        ></span>

                        <h3 className="text-lg font-bold text-slate-800 truncate">
                          {ad.title}
                        </h3>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ad.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {ad.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(ad)}
                        className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900" >
                  Ad Title *
                </label>
                <textarea
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Color *
                </label>
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-16 h-10 border rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg text-gray-900">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <span className="text-gray-900">Set as active</span>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border rounded-lg text-gray-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg"
                >
                  {editingAd ? "Update Ad" : "Create Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
