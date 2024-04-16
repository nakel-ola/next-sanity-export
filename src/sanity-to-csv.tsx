import { useState } from "react";
import { ExportButton } from "./export-button";
import "./globals.css";
import { usePage } from "./hooks/use-page";
import { cn } from "./utils/cn";

type Props = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  apiVersion?: string;
  dataset?: string;
  projectId: string;
  classes?: {
    root?: string;
    exportButton?: string;
    columns?: {
      root?: string;
      title?: {
        root?: string;
        text?: string;
        subtitle?: string;
      };

      badges?: {
        root?: string;
        activeButton?: string;
        inactiveButton?: string;
        defaultButton?: string;
      };

      buttons?: {
        root?: string;
        download?: string;
        cancel?: string;
      };
    };
  };
};
export const SanityToCsv = (props: Props) => {
  const {
    position = "top-right",
    apiVersion = "2024-01-20",
    dataset = "production",
    projectId,
    classes,
  } = props;

  const { pageType, contentName } = usePage();

  const [fields, setFields] = useState<{ name: string; selected: boolean }[]>(
    []
  );
  const [csvText, setCsvText] = useState<string | null>(null);
  const [json, setJson] = useState<any[]>([]);

  if (pageType !== "structure" || !contentName) return;

  const handleSelect = (index: number) => {
    let arr = [...fields];

    if (!arr[index]) return;

    arr[index].selected = !arr[index].selected;

    setFields(arr);
  };

  const convertJsonToCsv = (json: any[], fields: string[]) => {
    const items = json;
    const replacer = (key: string, value: any) => (value === null ? "" : value); // Handle null values
    const header = fields.length > 0 ? fields : Object.keys(items[0]);
    let array = items.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(",")
    );
    array.unshift(header.join(","));
    const csv = array.join("\r\n");
    return csv;
  };

  const downloadCsv = () => {
    const csvText = convertJsonToCsv(
      json,
      fields.filter((field) => field.selected).map((field) => field.name)
    );
    // Create a blob object
    const blob = new Blob([csvText], { type: "text/csv" });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a link element
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `${contentName}.csv`);

    // Simulate a click on the link to initiate the download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const reset = () => {
    setCsvText(null);
    setJson([]);
    setFields([]);
  };

  return (
    <div
      className={cn(
        "fixed z-[999999] flex flex-col  ",
        position === "top-left" ? "top-[70px] left-5" : "",
        position === "top-right" ? "top-[70px] right-5" : "",
        position === "bottom-left" ? "bottom-5 left-5 flex-col-reverse" : "",
        position === "bottom-right" ? "bottom-5 right-5 flex-col-reverse" : "",
        classes?.root
      )}
    >
      {!csvText ? (
        <ExportButton
          projectId={projectId}
          apiVersion={apiVersion}
          className={classes?.exportButton}
          dataset={dataset}
          position={position}
          onFetch={({ csvText, fields, json }) => {
            setFields(fields);
            setCsvText(csvText);
            setJson(json);
          }}
        />
      ) : (
        <div
          className={cn(
            "w-[90%] lg:w-[450px] min-h-[150px] rounded-lg border-[1.5px] border-neutral-700 bg-neutral-800 p-3 ",
            position.startsWith("bottom") ? "mb-2" : "mt-2",
            position.endsWith("right") ? "ml-auto" : "",
            classes?.columns?.root
          )}
        >
          <div className={cn("pb-5", classes?.columns?.title?.root)}>
            <p
              className={cn(
                "text-lg text-white",
                classes?.columns?.title?.text
              )}
            >
              Select which columns to export
            </p>
            <p
              className={cn(
                "text-xs text-neutral-400",
                classes?.columns?.title?.subtitle
              )}
            >
              By default, all columns are selected to be imported from your csv
            </p>
          </div>

          <div
            className={cn(
              "flex flex-wrap gap-3",
              classes?.columns?.badges?.root
            )}
          >
            {fields?.map((field, index) => (
              <div
                key={index}
                onClick={() => handleSelect(index)}
                className={cn(
                  "border-[1.5px] border-neutral-700 px-2.5 py-1 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300",
                  classes?.columns?.badges?.defaultButton,
                  field.selected
                    ? cn(
                        "bg-[rgba(236,_84,_70,_0.1)] border-[#EC5446]",
                        classes?.columns?.badges?.activeButton
                      )
                    : classes?.columns?.badges?.inactiveButton ?? ""
                )}
              >
                <p className="">{field.name}</p>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "flex items-end justify-end pt-5 gap-5",
              classes?.columns?.buttons?.root
            )}
          >
            <button
              type="button"
              className={cn(
                "px-2.5 py-1.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 bg-neutral-700",
                classes?.columns?.buttons?.cancel
              )}
              onClick={reset}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn(
                "px-2.5 py-1.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 bg-[#EC5446]",
                classes?.columns?.buttons?.download
              )}
              onClick={downloadCsv}
            >
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
