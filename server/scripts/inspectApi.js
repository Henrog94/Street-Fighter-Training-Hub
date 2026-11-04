
import { fetchExternalFighterData } from
  "../services/fighterImportService.js";

async function inspect() {
  try {
    const data = await fetchExternalFighterData();

    console.log("Data type:", Array.isArray(data)
      ? "Array"
      : typeof data
    );

    console.log(
      "Top-level keys:",
      Object.keys(data).slice(0, 20)
    );

    console.log(
      "Sample data:",
      JSON.stringify(
        Array.isArray(data) ? data[0] : Object.entries(data)[0],
        null,
        2
      ).slice(0, 6000)
    );
  } catch (error) {
    console.error("Import inspection failed:", error.message);
    process.exitCode = 1;
  }
}

inspect();
