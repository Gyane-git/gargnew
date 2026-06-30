"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Essentials, Paragraph, Heading, Bold, Italic, Link, List, Indent, IndentBlock, BlockQuote, Table, TableToolbar, Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageUpload, ImageInsert, Base64UploadAdapter, MediaEmbed } from "ckeditor5";

import "ckeditor5/ckeditor5.css";

const LICENSE_KEY = "GPL";

const EDITOR_CONFIG = {
  licenseKey: LICENSE_KEY,
  plugins: [Essentials, Paragraph, Heading, Bold, Italic, Link, List, Indent, IndentBlock, BlockQuote, Table, TableToolbar, Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageUpload, ImageInsert, Base64UploadAdapter, MediaEmbed],
  toolbar: {
    items: ["undo", "redo", "|", "heading", "|", "bold", "italic", "|", "link", "|", "insertImage", "|", "insertTable", "|", "blockQuote", "|", "mediaEmbed", "|", "bulletedList", "numberedList", "|", "outdent", "indent"],
    shouldNotGroupWhenFull: false,
  },
  image: {
    toolbar: ["imageStyle:inline", "imageStyle:block", "imageStyle:side", "|", "toggleImageCaption", "imageTextAlternative"],
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
  },
};

export default function RichTextEditor({ value, onChange, disabled = false }) {
  return (
    <CKEditor
      editor={ClassicEditor}
      config={EDITOR_CONFIG}
      data={value}
      disabled={disabled}
      onChange={(_event, editor) => {
        onChange(editor.getData());
      }}
    />
  );
}
