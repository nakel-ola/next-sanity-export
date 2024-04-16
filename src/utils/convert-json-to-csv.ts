export const convertJsonToCsv = (json: any[], fields: string[]) => {
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
