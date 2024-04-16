import { parse } from "json2csv";
import React, { useState } from "react";
import { MoonLoader } from "react-spinners";
import { usePage } from "./hooks/use-page";
import { cn } from "./utils/cn";
import { parseCSV } from "./utils/parse-csv";

type Props = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  projectId: string;
  apiVersion?: string;
  dataset?: string;
  onFetch: (args: {
    fields: { name: string; selected: boolean }[];
    csvText: string | null;
    json: any[];
  }) => void;
};
export const ExportButton = (props: Props) => {
  const {
    position,
    className,
    apiVersion = "2024-01-20",
    dataset = "production",
    projectId,
    onFetch,
  } = props;

  const [isLoading, setIsLoading] = useState(false);

  const { contentName } = usePage();

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

        onFetch({
          fields: csvParse.fields.map((key) => ({ name: key, selected: true })),
          csvText,
          json: csvParse.results,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <div
      onClick={handleFetchJson}
      className={cn(
        "h-[40px] w-[50px] hover:w-[150px] bg-[#EC5446] px-3 flex items-center justify-center rounded-full gap-2 cursor-pointer group transition-all duration-300 active:scale-95 hover:scale-105 overflow-hidden ",
        isLoading ? "w-[150px]" : "",
        position === "top-right" ? "ml-auto" : "",
        position === "bottom-right" ? "ml-auto" : "",
        className
      )}
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
  );
};
