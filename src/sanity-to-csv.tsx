import { parse } from "json2csv";
import { useState } from "react";
import { MoonLoader } from "react-spinners";
import "./globals.css";
import { usePage } from "./hooks/use-page";
import { cn } from "./utils/cn";
import { parseCSV } from "./utils/parse-csv";

type Props = {
  backgroundColor?: string;
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
    backgroundColor = "#EC5446",
    position = "top-right",
    apiVersion = "2024-01-20",
    dataset = "production",
    projectId,
    classes,
  } = props;

  const { pageType, contentName } = usePage();

  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState<{ name: string; selected: boolean }[]>(
    []
  );
  const [csvText, setCsvText] = useState<string | null>(null);
  const [json, setJson] = useState<any[]>([]);

  if (pageType !== "structure" || !contentName) return;

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/export/${dataset}/?types=${contentName}`;

  const handleFetchJson = async () => {
    setIsLoading(true);
    await fetch(url)
      .then(async (res) => {
        const text = await res.text();

        const cleanedText = text.replace(/\s/g, "");

        // Remove any trailing commas that might cause parsing errors
        const cleanedTextWithoutTrailingComma = cleanedText.replace(
          /}{/g,
          "},{"
        );

        // Wrap the cleaned-up text in brackets to create a valid JSON array
        const jsonArray = `[${cleanedTextWithoutTrailingComma}]`;

        const data = JSON.parse(jsonArray);

        if (data.length === 0) return;

        const csvText = parse(data);

        const csvParse = await parseCSV(csvText);

        setFields(
          csvParse.fields.map((key) => ({
            name: key,
            selected: true,
          }))
        );
        setCsvText(csvText);
        setJson(csvParse.results);

        // Create a blob object
        // const blob = new Blob([csvText], { type: "text/csv" });

        // Create a temporary URL for the blob
        // const url = URL.createObjectURL(blob);

        // Create a link element
        // const link = document.createElement("a");
        // link.href = url;
        // link.setAttribute("download", `${contentName}.csv`);

        // Simulate a click on the link to initiate the download
        // document.body.appendChild(link);
        // link.click();

        // Cleanup
        // URL.revokeObjectURL(url);
        // document.body.removeChild(link);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

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
        <div
          onClick={handleFetchJson}
          className={cn(
            "h-[40px] w-[50px] hover:w-[150px] px-3 flex items-center justify-center rounded-full gap-2 cursor-pointer group transition-all duration-300 active:scale-95 hover:scale-105 overflow-hidden ",
            isLoading ? "w-[150px]" : "",
            position === "top-right" ? "ml-auto" : "",
            position === "bottom-right" ? "ml-auto" : "",
            classes?.exportButton
          )}
          style={{ backgroundColor }}
        >
          {isLoading ? (
            <>
              <MoonLoader size={20} color="#ffffff" />
              <p className="text-white text-sm shrink-0 transition-all duration-300 font-sans">
                Loading ...
              </p>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <path
                  stroke="#ffffff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  strokeWidth="1.5"
                  d="M9.32 6.5l2.56-2.56 2.56 2.56M11.88 14.18V4.01M4 12c0 4.42 3 8 8 8s8-3.58 8-8"
                ></path>
              </svg>

              <p className="text-white text-sm shrink-0 hidden opacity-0 group-hover:opacity-100 group-hover:block transition-all duration-300 font-sans">
                Export to csv
              </p>
            </>
          )}
        </div>
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
