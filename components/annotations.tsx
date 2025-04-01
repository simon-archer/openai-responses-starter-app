import { ExternalLink, FileText } from "lucide-react";
import { useFiles } from "./context/files-context";

export type Annotation = {
  type: "file_citation" | "url_citation";
  fileId?: string;
  url?: string;
  title?: string;
  filename?: string;
  index?: number;
};

const AnnotationPill = ({ annotation }: { annotation: Annotation }) => {
  const { openFileInTab, files, findFileById } = useFiles();

  const handleFileClick = () => {
    console.log("Full annotation object:", JSON.stringify(annotation, null, 2));
    
    // Early validation of the annotation
    if (!annotation) {
      console.error("No annotation object provided");
      return;
    }

    // For file citations, we need either fileId or some other identifier
    if (annotation.type === "file_citation") {
      if (!annotation.fileId && !annotation.filename) {
        console.error("File citation missing both fileId and filename");
        return;
      }

      // If we have a filename but no fileId, try to find the file by name
      if (!annotation.fileId && annotation.filename) {
        const fileByName = files.find(f => f.name === annotation.filename);
        if (fileByName) {
          console.log("Found file by name:", fileByName);
          openFileInTab(fileByName.id);
          return;
        }
      }

      // If we have a fileId, try our previous approach
      if (annotation.fileId) {
        // First try to find a local file that has this vectorStoreFileId
        const localFile = files.find(file => file.vectorStoreFileId === annotation.fileId);
        if (localFile) {
          console.log("Found local file by vectorStoreFileId:", localFile);
          openFileInTab(localFile.id);
          return;
        }

        // If we couldn't find it by vectorStoreFileId, try direct ID match
        const directFile = findFileById(annotation.fileId, files);
        if (directFile) {
          console.log("Found file by direct ID:", directFile);
          openFileInTab(annotation.fileId);
          return;
        }
      }

      console.error("Could not find file:", {
        fileId: annotation.fileId,
        filename: annotation.filename,
        availableFiles: files.map(f => ({ id: f.id, name: f.name, vectorStoreFileId: f.vectorStoreFileId }))
      });
    }
  };

  switch (annotation.type) {
    case "file_citation":
      return (
        <button 
          onClick={handleFileClick}
          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded px-1.5 py-0.5 transition-colors max-w-[200px] group"
          title={`Open ${annotation.filename || 'file'}`}
        >
          <FileText size={10} className="mr-1 flex-shrink-0" />
          <span className="truncate group-hover:text-clip">{annotation.filename || 'Unnamed file'}</span>
        </button>
      );
    case "url_citation":
      return (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={annotation.url}
          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded px-1.5 py-0.5 transition-colors"
        >
          <span className="truncate max-w-[140px]">{annotation.title}</span>
          <ExternalLink size={10} className="ml-1 flex-shrink-0" />
        </a>
      );
  }
};

const Annotations = ({ annotations }: { annotations: Annotation[] }) => {
  const uniqueAnnotations = annotations.reduce(
    (acc: Annotation[], annotation) => {
      if (
        !acc.some(
          (a: Annotation) =>
            a.type === annotation.type &&
            ((annotation.type === "file_citation" &&
              a.fileId === annotation.fileId) ||
              (annotation.type === "url_citation" && a.url === annotation.url))
        )
      ) {
        acc.push(annotation);
      }
      return acc;
    },
    []
  );

  if (uniqueAnnotations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 ml-0.5 text-gray-400 text-[10px] mt-1">
      {uniqueAnnotations.map((annotation: Annotation, index: number) => (
        <AnnotationPill key={index} annotation={annotation} />
      ))}
    </div>
  );
};

export default Annotations;
