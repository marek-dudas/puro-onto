import jsonData from './rules.json';

import $ from 'jquery';


export default class RuleController {


    constructor() {

        this.rdf = require('rdflib');
        var puro ;
        
        $.ajax({
            type: "GET",
            url: "http://localhost:3000/puroOutput.xml",
            async: false,
            cache: false,
            dataType: "xml",
            success: function(xml) {
                this.puroXML = xml;
                puro = xml; 
            }
        });
        this.puroXML = puro;
        this.rulesJson = JSON.parse(JSON.stringify(jsonData));
  
      
    }
    
    
    firstFind = () => {
        //console.log(this.xmlText);
        var puroXML = this.puroXML;
        var rulesJson = this.rulesJson;
        var result = [];
        
        
        var s = new XMLSerializer();
        puroXML = new XMLSerializer().serializeToString(puroXML);
       
        var store = this.rdf.graph();
        var contentType = 'application/rdf+xml';
        var baseUrl = "http://lod2-dev.vse.cz/";
        
         this.rdf.parse(puroXML, store, baseUrl, contentType); 

        var turtle;
         this.rdf.serialize(undefined, store, "http://www.w3sds.org/1999/02/22-rdf-syntax-ns#type", 'text/turtle', function(err, str){
            turtle = str;
        })

        var rdfstore = require('rdfstore');
        rdfstore.create(function(err, store) {
            store.load("text/turtle", turtle, function(err, results) {
               
                store.execute(`
                PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?btype  WHERE 
                {
                    ?btype  a puro:BType
                    FILTER NOT EXISTS {?btype puro:linkedTo ?obj}
                    FILTER NOT EXISTS {?btype puro:subTypeOf ?object}
                }`,
                function(err, results) {
                  console.log("ted");
                  console.log(results);

                });

            });
        });
        





         var type = this.rdf.sym("http://lod2-dev.vse.cz/ontology/puro#BType");
         var me = this.rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        const allTriples = store.statementsMatching(undefined, me, type);
    

        const sparqlQuery = 
        `PREFIX on: <http://lod2-dev.vse.cz/ontology/puro#>
        SELECT  ?type 
        WHERE {
            ?type a on:BType.
          MINUS {?type on:subTypeOf ?p}
          MINUS {?type on:instanceOf ?p}
        }
        `;
        const query = this.rdf.SPARQLToQuery(sparqlQuery, false, store);

        store.query(query, function(result) {
            console.log('query ran');
           // console.log(result);
        });

        /*
        var elementsJson = JSON.parse('{"elements":[]}');
        $(puroXML).find("puro\\:BRelation").each(function () {
            elementsJson["elements"].push({"name" : $(this).attr("rdf:about"), "type": "BRelation"});
             //Podívá se na relation a nadjde všechny linkedTO
             console.log($(this)[0]);
            $(this).find("puro\\:linkedTo").each(function () {
                var resource = ($(this).attr("rdf:resource"));
               
                //Najde linked to element
                var linkedElement = $(puroXML).find('[rdf\\:about="' + resource + '"]');
                //kontrola typu linked to elementu
                if (linkedElement[0].tagName == "puro:BObject") // do BTYPE!!!!!!!!!!!!!!
                {
                    //zapíše název OBJEKTU    
                    elementsJson["elements"].push({"name" : linkedElement[0].getAttribute("rdf:about"), "type": linkedElement[0].tagName.replace("puro:","")});
                    
                    var btypeURL = linkedElement.find("puro\\:instanceOf").attr("rdf:resource");
                     
                    $(puroXML).find('[rdf\\:about="' + btypeURL + '"]').each(function () {
                        //Zapíše URL BTYPE 
                        
                        
                        if($(this).children("puro:instanceOf").length > 0)
                        {
                            //reverzní funkce  
                            elementsJson["elements"].push({"name" : $(this).attr("rdf:about"), "type": "subObject"});
                            var blab = this.findLastBtype($(this), puroXML,elementsJson)

                        }
                        else
                        {
                           elementsJson["elements"].push({"name" : $(this).attr("rdf:about"), "type": "object"});      
                        }
                    });




                /*
                    for (let i in rulesJson.rules) {
                        if (rulesJson.rules[i].fromPuro == "BObject" && rulesJson.rules[i].fromOnto == "") {      
                            return result = ["What type is Author??",Array.from(rulesJson.classes), BTypeName]; 
                        }
                    }
                    
                    // this.setState(buttons: [])
                }
                else if (linkedElement[0].tagName == "puro:BType") {

                }
                else if (linkedElement[0].tagName == "puro:Attribute") {

                }

            });
        });

        */
    }


    findLastBtype = (childNode, treeXML, jsonTree) => {
        
        
        //Pro každý subObjekt najdi finální objekt 
        $(this).children("puro:instanceOf").each(function() {
           var father =  $(treeXML).find('[rdf\\:about="' + $(this).attr("rdf:resource") + '"]');
           if ($(father).children("puro:instanceOf").length > 0)
           {
                // velka spatna
                
                jsonTree["elements"].push({"name" : $(father).attr("rdf:about"), "type": "subObject"});
                this.findLastBtype()
           }
           else
           {
               //konecStromu
               jsonTree["elements"].push({"name" : $(father).attr("rdf:about"), "type": "object"});
           }
        });



    }

}

