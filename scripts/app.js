requirejs.config({
  //By default load any module IDs from js/lib
  baseUrl: "scripts/lib",
  // ../ is a shorthand for parent directory, used to override baseUrl
  paths: {
    app: "../app",
    src: "../src",
    lemmatizer: "lemmatizer-v0.0.2",
    underscore: "underscore-umd-min",
    jquery: "jquery-3.7.1.min",
    json: "require/json",
    text: "require/text"
  }
});

// Start the main app logic.
requirejs(["jquery", "app/phrases"],
function (  $,        phrases) {
  
  function addRow(event) {
    // Create the row
    const newRow = $("<div></div>").attr("class", "row");
    const entries = [];
    
    // If addRow was called by an entry
    if (event !== null && $(event.target).hasClass("entry")) {
      // Make the clicked entry the only one, and highlighted
      const entry = $(event.target);
      entry.css("outline", "2px solid green");
      entry.siblings().remove();

      // Remove all following rows if there are any
      if (entry.parent().nextAll().length !== 0) {
        // Slide each up then delete it
        entry.parent().nextAll().each( function() {
          $(this).slideUp(100, $(this).remove);
        });
      } // End row removal

      // Save each connection as a full object
      entries.push(allConnections( entry.data("lookup") ));
    } // End entry-call operations
    
    $("#canvas").append(newRow);

    if (entries.length !== 0) {
      entries.forEach(addEntry(this));
    }
  } // End addRow
  
  function addEntry(lookupObj) {
    // Add a row if there aren't any already
    if ($(".row").length === 0) {
      addRow(null);
    }
    
    // Create the entry
    const newEntry = $("<div></div>").attr("class", "entry");
    newEntry.data( "lookup", lookupObj );
    const txt = phrases.fetch( lookupObj.index );
    newEntry.text( txt.phrase );
    $(".row").last().append(newEntry);
  } // End addEntry

  function allConnections(lookupObj) {
    if ( !Object.hasOwn(lookupObj, "connections") ) {
      return; // Exit early, without raising an error
    }
    
    const connections = lookupObj.connections;
    for (let i = 0; i < connections.length; i++) {
      connections[i] = phrases.fetchLookup(connections[i].index);
    }
    
    return connections;
  }
  
  // When the document has loaded, add event listeners
  $(document).ready(function() {
    const mostLikely = phrases.fetchLookup(0);
    addEntry(mostLikely);
    
    $("#canvas").on("click", ".entry", addRow);
  });
}); // End of main logic
