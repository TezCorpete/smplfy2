requirejs.config({
  //By default load any module IDs from js/lib
  baseUrl: "scripts/lib",
  // ../ is a shorthand for parent directory, used to override baseUrl
  paths: {
    app: "../app",
    src: "../src",
    lemmatizer: "lemmatizer",
    underscore: "underscore-umd-min",
    jquery: "jquery-3.7.1.min",
    json: "require/json",
    text: "require/text"
  }
});

// Start the main app logic.
requirejs(["jquery", "app/phrases", "json!src/lookup.json", "json!src/phrases.json"],
function   ($,        phrases,       phraseData) {
  
  function addRow(event) {
    // If addRow was called by an entry
    if (event !== null && $(event.target).hasClass("entry")) {
      // Make the clicked entry the only one highlighted
      const entry = $(event.target);
      entry.css("outline", "2px solid green");
      entry.siblings().css("outline", "none");
      
      // Remove all following rows
      if (entry.parent().nextAll().length !== 0) {
        // Slide each up then delete it
        entry.parent().nextAll().each( function() {
          $(this).slideUp(300, $(this).remove);
        });
      } // End row removal
    } // End entry-call operations
    
    // Create the row
    const newRow = $("<div></div>").attr("class", "row");
    $("#canvas").append(newRow);
  } // End addRow
  
  function addEntry(event) {
    // Add a row if there aren't any already
    if ($(".row").length === 0) {
      addRow(null);
    }
    
    // Create the entry
    const newEntry = $("<div></div>").attr("class", "entry");
    newEntry.text(event.data.info);
    $(".row").last().append(newEntry);
  } // End addEntry
  
  // When the document has loaded, add event listeners
  $(document).ready(function() {
    $("#title").on("click", {info: "temp"}, addEntry);
    $("#canvas").on("click", ".entry", addRow);

    
  });
}); // End of main logic
