"use client";

import { useRef, useState } from "react";

export default function PosterCardsPage() {
  const initialCards = [
    {
      id: 1,
      title: "Card 1",
      image: null,
      fileName: "No file chosen",
      file: null,
    },
    {
      id: 2,
      title: "Card 2",
      image: null,
      fileName: "No file chosen",
      file: null,
    },
    {
      id: 3,
      title: "Card 3",
      image: null,
      fileName: "No file chosen",
      file: null,
    },
  ];

  const [cards, setCards] = useState(initialCards);

  const fileRefs = [useRef(null), useRef(null), useRef(null)];

  const handleFileChange = (e, index) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    const updated = [...cards];

    updated[index] = {
      ...updated[index],
      image: imageUrl,
      fileName: file.name,
      file,
    };

    setCards(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Submitted Data:", cards);

    cards.forEach((card) => {
      console.log({
        title: card.title,
        fileName: card.fileName,
        file: card.file,
      });
    });
  };

  const removeImage = (index) => {
    const updated = [...cards];

    updated[index].image = null;
    updated[index].fileName = "No file chosen";

    setCards(updated);

    if (fileRefs[index].current) {
      fileRefs[index].current.value = "";
    }
  };

  const handleCancel = () => {
    setCards(initialCards);

    fileRefs.forEach((ref) => {
      if (ref.current) {
        ref.current.value = "";
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] flex flex-col">
      {/* Content */}
      <div className="flex-1 flex justify-center py-8">
        <div className="bg-white w-full max-w-5xl rounded-md shadow-sm px-8 py-6">
          <h2 className="text-center text-2xl font-bold text-[#0c3d91] mb-10">Poster Cards</h2>

          <div className="grid grid-cols-3 gap-10">
            {cards.map((card, index) => (
              <div key={card.id ?? index}>
                <label>{card.title}</label>

                <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
                  <button type="button" onClick={() => fileRefs[index].current?.click()} className="bg-gray-100 hover:bg-gray-200 px-3 py-2 border-r border-gray-300 text-gray-800">
                    Choose File
                  </button>

                  <span className="px-3 py-1.5 text-gray-500 min-w-[140px]">{card.fileName}</span>

                  <input ref={fileRefs[index]} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, index)} />
                </div>

                {/* Image Preview */}
                {card.image && (
                  <div className="mt-4 relative inline-block">
                    <img src={card.image} alt={card.title} className="w-32 h-32 border rounded-lg object-contain bg-white" />

                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Buttons */}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-end gap-5 mt-10">
              <button type="submit" className="bg-[#198754] hover:bg-[#157347] text-white px-4 py-2 rounded">
                Update Card
              </button>

              <button type="button" onClick={handleCancel} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}

      <footer className="border-t py-5 text-center text-sm text-[#0c3d91]">
        Copyright © 2026 <span className="font-semibold">Global Tech Nepal Pvt. Ltd.</span>
      </footer>
    </div>
  );
}
