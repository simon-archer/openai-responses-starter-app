import { ExternalLink, FileText } from "lucide-react";

export type Annotation = {
  type: "file_citation" | "url_citation";
  fileId?: string;
  url?: string;
  title?: string;
  filename?: string;
  index?: number;
};

const AnnotationPill = ({ annotation }: { annotation: Annotation }) => {
  switch (annotation.type) {
    case "file_citation":
      return (
        <span className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700">
          <FileText size={10} className="mr-1 flex-shrink-0" />
          <span className="truncate">{annotation.filename}</span>
        </span>
      );
    case "url_citation":
      return (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={annotation.url}
          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700"
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
    <div className="flex flex-wrap ml-0.5 gap-x-3 text-gray-400 text-[10px] mt-1">
      {uniqueAnnotations.map((annotation: Annotation, index: number) => (
        <AnnotationPill key={index} annotation={annotation} />
      ))}
    </div>
  );
};

export default Annotations;
