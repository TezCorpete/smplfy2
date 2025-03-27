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

  const addedEntries = []; // The index of each entry on canvas
  
  function addRow(event) {
    // Create the row
    const newRow = $("<div></div>").attr("class", "row");
    let entries = [];
    
    // If addRow was called by an entry
    if (event !== null && $(event.target).hasClass("entry")) {
      // Make the clicked entry the only one, and highlighted
      const entry = $(event.target);
      
      entry.css("outline", "2px solid green");
      console.log(addedEntries);
      removeFromAddedEntries(entry.siblings());
      console.log(addedEntries);
      entry.siblings().remove();

      // Remove all following rows if there are any
      if (entry.parent().nextAll().length !== 0) {
        // Slide each up then delete it
        entry.parent().nextAll().each( function() {
          removeFromAddedEntries($(this).children());
          $(this).slideUp(100, $(this).remove);
        });
        
        console.log(addedEntries);
      } // End row removal

      // Save each connection as a full lookup object
      entries = expandConnections( entry.data().lookup );
    } // End entry-call operations
    
    $("#canvas").append(newRow);
    
    for (let i = 0; i < entries.length; i++) {
      addEntry( entries[i] );
    }
  } // End addRow
  
  function addEntry(lookupObj) {
    // Add a row if there aren't any already
    if ($(".row").length === 0) {
      addRow(null);
    }

    if ( !addedEntries.includes(lookupObj.index) ) {
  
      addedEntries.push(lookupObj.index);
      
      // Create the entry
      const newEntry = $("<div></div>").attr("class", "entry");
      const real = phrases.fetch( lookupObj.index );
      newEntry.text( real.phrase );
      newEntry.data( "lookup", lookupObj );
      $(".row").last().append(newEntry);
    } // End canvas check for entry
  } // End addEntry

  function expandConnections(entry) {
    if ( !Object.hasOwn(entry, "connections") ) {
      return;
    }

    const full = [];
    const connections = entry.connections;
    for (let i = 0; i < connections.length; i++) {
      const lookup = phrases.fetchLookup( connections[i].index );
      full.push(lookup);
    }

    return full;
  }

  function removeFromAddedEntries(entries) {
    for (let i = 0; i < entries.length; i++) {
      const curr = entries[i];

      for (let j = 0; j < addedEntries.length; j++) {
        if (addedEntries[j] === curr.index) {
          addedEntries.remove(j);
          break; // Break from inner loop to save time
        }
      } // End j / addedEntries loop
    } // End i loop
  } // End rFAE

  Array.prototype.remove = function(index) {
    this.splice(index, 1); // Remove 1 element from the arry, starting at index
  }
  
  // When the document has loaded, add event listeners
  $(document).ready(function() {
    addEntry(phrases.mostLikely);
    
    $("#canvas").on("click", ".entry", addRow);
  });
}); // End of main logic
