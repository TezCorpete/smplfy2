
define(["lemmatizer", "json!src/phrases.json", "json!src/lookup.json"], 
function(lem,          phraseData,              lookupData) {
  // **************************************************
  // Setup
  // **************************************************
  
  // Initialize the lemmatizer
  const lemmatizer = new lem.Lemmatizer();

  // json.js plugin automatically parses, so no parsing needed

  let mostLikely;
  let highestRelevance = 0;
  
  for (let i = 0; i < lookupData.length; i++) {
      const curr = lookupData[i];
      if (curr.relevance > highestRelevance) {
        highestRelevance = curr.relevance;
        mostLikely = curr;
      }
    }
  
  // **************************************************
  // Internal/Private (Not included in return statement)
  // **************************************************
  
  // For my sanity, I have wrapped the ".splice()" method of removing
  // a specific element in an Array in a function that doesn't look hacky
  Array.prototype.remove = function(index) {
    this.splice(index, 1); // Remove 1 element from the arry, starting at index
  }
  
  /*
   * Check if a string is an acronym
   * Explanation:
   *   From the start of the string to the end, ("^" to "$")
   *   check if there are at least 2 ("{2,}")
   *   valid acronym characters / non-lowercase letters. ("[A-Z&]")
   */
  String.prototype.isAcronym = function() {
    return (/^[A-Z&]{2,}$/).test(this);
  }
  
  /**
   * Removes all acronyms from an Array of words
   * @param {Array} arr - A list potentially containing acronyms
   * @return {void} - All changes to arr are automatically applied
   * Didn't need to be an extension, just looks better this way
   */
  function removeAcronyms(arr) {
    let length = arr.length;
    let i = 0;
    while (i < length) {
      if (arr[i].isAcronym()) {
        arr.remove(i);
        // Element i has been removed, so the next element also has index i
      } else { // Not an acronym
        i++;
      }
      length = arr.length;
    } // End of loop
  } // End of removeAcronyms
  
  /**
   * Searches for all first-degree connections between phrases
   * @param {Array} phrases - A list of lookup objects
   * @return {void} - All changes to the objects are automatically applied
   */
  function generateConnections(phrases) {
    const phrase = 0;
    const meaning = 1;
    const category = 2;
    
    for (let i = 0; i < phrases.length; i++) {
      const curr = phrases[i];
      const connections = [];

      for (let j = 0; j < phrases.length; j++) {
        // Don't execute on curr
        if (i === j) {
          continue;
        }
        
        const other = phrases[j];

        // If any are true, a connection would be made. Better than a massive "or".
        if ( (Object.hasOwn(curr, "acronyms") && Object.hasOwn(other, "acronyms"))     // If they have matching
        && ( curr.acronyms.some((acr) => other.acronyms.includes(acr))                 // acronyms, connect them.
        || other.acronyms.includes(curr.lemmas[phrase]) ) ) {                          // Phrase might be there, too
          connections.push({ "index": j });
        } else if ( curr.lemmas[meaning].includes(other.lemmas[phrase])                // Or if either phrase is
        || other.lemmas[meaning].includes(curr.lemmas[phrase]) ) {                     // in the other's meaning
          connections.push({ "index": j });
        } else if ( (curr.lemmas.length > 2 && other.lemmas.length > 2)                // Or if they have
        && (curr.lemmas[category] == other.lemmas[category]) ) {                       // matching categories
          connections.push({ "index": j });
        } // End of "if" brick
      } // end other loop

      if (connections.length > 0) {
        // Add the actual phrase to each of the connections
        for (let k = 0; k < connections.length; k++) {
          const cnctn = connections[k];
          cnctn.phrase = phraseData[cnctn.index].phrase;
        }
        curr.connections = connections;
      }
    } // End curr loop
  } // End of generate connections

  /**
   * Compares how likely a lookup Object is to appear
   * @param {Object} entry - A lookup object
   * @return {Number} - the calculated relevance
   */
  function calcRelevance(entry) {
    // Not a true comparison of relevance, but close enough.
    let relevance = entry.lemmas.length;
    
    if (Object.hasOwn(entry, "acronyms")) {
      relevance += entry.acronyms.length;
    }
    
    if (Object.hasOwn(entry, "connections")) {
      relevance += entry.connections.length;
    }

    return relevance;
  }
  
  /**
   * Generates the normalized list of phrase data, printing it to the console to be copied.
   */
  function printNormalizedPhraseData() {
    // Start the list
    const lookup = [];

    // Run for all phrases
    for (let i = 0; i < phraseData.length; i++) {
      // Get the current phrase, instantiate object
      const entry = phraseData[i];
      const lookupObj = {};

      // Lemmatize almost all info
      const lemms = [];
      // If the phrase is an acronym, don't normalize it
      if (entry.phrase.isAcronym()) {
        lemms.push(entry.phrase);
      } else {
        lemms.push(pickyNormalize(entry.phrase));
      }
      lemms.push(pickyNormalize(entry.meaning));
      // Only if category exists
      if (Object.hasOwn(entry, "category")) {
        lemms.push(pickyNormalize(entry.category));
      }
      lookupObj.lemmas = lemms;

      // Add acronyms, if applicable
      if (Object.hasOwn(entry, "acronyms")) {
        lookupObj.acronyms = entry.acronyms;
      }

      lookupObj.index = i;
      
      lookup.push(lookupObj);
    } // End of for

    // This'll take a while, but I don't know enough
    // big O to tell you just how inefficient it is.
    generateConnections(lookup);

    for (let i = 0; i < lookup.length; i++) {
      const curr = lookup[i];
      curr.relevance = calcRelevance(curr);
    }
    
    // Convert every element to JSON text
    const data = lookup.map((datum) => JSON.stringify(datum));
    
    console.log(`[\n  ${data.join(",\n  ")}\n]`);
  } // End of pNPD
  
  // **************************************************
  // Public
  // **************************************************
  
  /**
   * Normalizes the given fragment by removing any features that are potentially ever-so-slightly different
   * @param {String} text - A string that may contain some punctuation, which is to be removed
   * @return {String} - The original text, sans acronyms, punctuation, capitalization, and alternate word forms
   */
  function pickyNormalize(text) {
    // Replace all punctuation with spaces
    text = text.replaceAll(/[,.()\/'-]/g, " ");

    // Do a pass removing all invalid single letter words
    text = text.replaceAll(/[\s]+[^AaI][\s]+/g, " "); // O is only used in poetry, so it isn't valid here
    
    // Make an array of all the words, without surrounding spaces
    const words = text.split(/[\s]+/);
    words.map((each) => each.trim()); // Redundancy is key when you don't know what you are doing
    
    removeAcronyms(words);

    // Remove capitalization for all words
    const capNormalized = words.map((word) => word.toLowerCase()); // Arrow notation for the win!
    
    // Get one lemma for each word (Only ever choosing the first lemma should be fine, right?)
    const normalized = capNormalized.map((word) => lemmatizer.only_lemmas(word)[0]); // ".only_lemmas" returns a list

    // Return the line, a string once more
    return normalized.join(" ").trim();
  }

  /**
   * Normalizes the given text, saving acronyms and other meaningful word strings
   * @param {String} text - A string that may contain some punctuation, which is to be ignored
   * @return {String} - The original text, sans capitalization, punctuation, and alternate word forms
   */
  function nonDestructiveNormalize(text) {
    // Remove all punctuation
    text = text.replaceAll(/[,.()\/'-]/g, " ");

    // Do a pass removing all invalid single letter words
    text = text.replaceAll(/[\s]+[^AaI][\s]+/g, ""); // "O" is only used in poetry, so it isn't valid here
    
    // Make an array of all the words, without surrounding spaces
    const words = text.split(/[\s]+/);
    const trimmed = words.map((each) => each.trim()); // Redundancy is key when you don't know what you are doing

    // Remove capitalization for all words except acronyms
    const capNormalized = trimmed.map((word) => {
      if (word.isAcronym()) {
        return word;
      }
      return word.toLowerCase();
    } );
    
    // Lemmatizer tends to delete " a ", hence the differentiation
    // Get one lemma for each word (Only ever choosing the first lemma should be fine, right?)
    const normalized = capNormalized.map( (word) => {
      if (word.isAcronym() || word.valueOf() == "a") {
        return word;
      }
      // Otherwise, it's business as usual
      return lemmatizer.only_lemmas(word)[0]; // ".only_lemmas" returns a list
    } );

    // Return the line, a string once more
    return normalized.join(" ").trim();
  }

  /**
   * Fetches a phrase at the given position from lookup
   * @param {int} index - The index of the phrase to be fetched in lookup.json (NOT index attr)
   * @return {Object} - The lookup object at that index
   */
  function fetchLookup(index) {
    return lookupData[index];
  }

  /**
   * Fetches a phrase at the given position from phrases
   * @param {int} index - The index of the phrase to be fetched in phrases.json 
   * @return {Object} - The phrase object at that index
   */
  function fetch(index) {
    return phraseData[index];
  }

  /**
   * Finds all matching phrases in the database
   * @param {string} text - The text to be parsed for phrases
   * @return {Object} - A list of match objects, set up as follows
   *   lookup: The matched phrase in lookup.json
   *   locations: A list of objects
   *     index: the starting index of the match in text,
   *            split on whitespace. 
   *     span: how many split-on-whitespace-elements the match covers
   */
  function findMatches( text ) {
    text = nonDestructiveNormalize( text );
    
    const matches = [];

    for (let i = 0; i < lookupData.length; i++) {
      const currLookup = lookupData[i];

      const locations = [];

      const rawIndices = searchForXInY(currLookup, text);
      // While anything is found
      while ( rawIndices.length > 0 ) {
        // Save the first place something matched at
        let firstThing = rawIndices[0];
        for (let j = 1; j < rawIndices.length; j++) {
          if (rawIndices[j].index < firstThing.index) {
            firstThing = rawIndices[j];
          }
        }

        console.log("  First thing: " + firstThing);

        // Save the location, relative to splits at spaces
        const span = firstThing.thing.split(/[\s]+/g).length;

        console.log("    With a span of " + span);

        const textBeforeThing = text.substring(0, firstThing.index)
        // Doesn't count the trailing space, so length can be used as is
        const index = textBeforeThing.split( /[\s]+/g ).length;

        console.log("    At word index " + index);

        locations.push( {
          "index": index,
          "span": span
        } );

        // Clear the list
        rawIndices.splice(0, rawIndices.length);
        // Add the next search
        const nextResults = searchForXInY(currLookup, text, firstThing.index + 1);
        for (let j = 0; j < nextResults.length; j++) {
          rawIndices.push( nextResults[j] );
        }
      } // End location loop
      
      if ( locations.length > 0 ) {
        matches.push( {
          "lookup": currLookup,
          "locations": locations
        } );
      }
    } // End lookup loop

    return matches;
  } // End findMatches

  /**
   * Finds the "raw" or not-word-based index of things
   * @param {Object} lookup - The lookup you want to check for
   * @param {String} reference - Where you want to search for things
   * @param {int} index - The starting index of the search. Defaults to 0.
   * @return {Array} - A list of indices / what was checked as objects
   */
  function searchForXInY( lookup, reference, index) {
    const indices = [];

    // I didn't properly lowercase the phrase or category, so...
    let things = [ lookup.lemmas[0].toLowerCase() ];
    if ( Object.hasOwn(lookup, "acronyms") ) {
      things = things.concat( lookup.acronyms );
    }
    // If it has a category
    if ( lookup.lemmas.length > 2 ) {
      things = things.concat( lookup.lemmas[2].toLowerCase() );
    }

    for (let i = 0; i < things.length; i++) {
      
      console.log( "Checking this thing: " + things[i] );

      const iOf = reference.indexOf(things[i], index);
      const checked = things[i];
      
      if ( iOf > -1 ) {
        indices.push({
          "index": iOf,
          "thing": checked
        });
      }
    }

    if ( indices.length > 0 ) {
      console.log("Index of x in y: " + indices);
    }
    
    return indices;
  }
  
  return {
    "nonDestructiveNormalize": nonDestructiveNormalize, // Weirdo
    "pickyNormalize": pickyNormalize,
    "fetch"         : fetch,
    "fetchLookup"   : fetchLookup,
    "findMatches"   : findMatches,
    "mostLikely"    : mostLikely
  };
}); // End of define
