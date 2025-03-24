A scholastic project, with the event hosted by the insurance company by the name of State Farm.

This is in no way an official State Farm repository, 
therefore any actions taken involving it do not reflect State Farm policy,
or even imply the organization's or any employee of said's involvement.

Dependencies: (Yes, I really know this little about JS / web development)
  - RequireJS (scripts/require.js): Library for managing dependencies, used heavily to make up for my inexperience with JavaScript
    - json.js (scripts/lib/require/json.js): Plugin for RequireJS, allows for convenient access to JSON files on the web
    - text.js (sibling of json.js): Plugin for RequireJS, as of yet only used as dependency of json.js
  - jQuery (scripts/lib/jquery-3.7.1.min.js): DOM manipulation and fetching data from URLs, used to remove all spaghetti code from main website logic
  - Lemmatizer (scripts/lib/lemmatizer-v0.0.2.js): Retrieving the root form of words, used as part of the "search-and-find" functionality of the website
    - UnderscoreJS (scripts/lib/lemmatizer-v0.0.2.js): Library of general-use functions, only utilized as dependency of Lemmatizer
                                                       (I was already running out of time, I don't need to learn another library)

File sources:
  - dict folder (scripts/lib/dict/*): All the JSON files included on [Takafumi Yamano's GitHub page]([url](https://github.com/takafumir/javascript-lemmatizer/tree/master/dict)) under a folder of the same name,
                                      all being dependencies of Lemmatizer
  - src folder (scripts/src/*): JSON files containing webscraped phrases restructured for use in this program or any relevant info used by the program
    - phrases.json Object Structure:
      - phrases: Single object containing all 508 phrases (may be removed, leaving the JSON file as a list)
        - phrase: A single word, acronym, or phrase commonly used in insurance
        - meaning: A definition of the phrase, occasionally including an example (infrequently enough not to be separated)
        - category: Extra information separated from the phrase by the site the phrases were scraped from (open online resource, TODO: Add site name, url)
                  > NOTICE: If "category" appeared in "acronyms", "category" was removed during processing.
                          Not all phrases contained a category at the time of scraping.
        - acronyms: A list of acronyms (Strings of consecutive capital letters / non-punctuation symbols, for example the ampersand / "&").
                  > NOTICE: If an acronym was found that matches "phrase" exactly, that acronym was removed during processing.
                          "acronyms" is not included if none were found.
                  > WARNING: At least one phrase object contains acronyms from an example contained in the "meaning" attribute, and may or may not result in false positives.
    - Tenative structure for a look-up table yet to be generated
      - entries: Single object in similar format to phrases.json's phrases object. Ordered by length of the first element in "lemmas" (the phrase), longest to shortest. Phrases of identical length are alphabetical
        - lemmas: Contains list with the lemmatized version of the phrase, followed by every included acronym. A better name for this attribute exists, I just can't think of it.
                > NOTICE: If the phrase IS an acronym, the acronym is included as is.
        - index: The index of the phrase the entry is associated with
