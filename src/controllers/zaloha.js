import $ from 'jquery';


export default class RdfController {
    
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
    }


    getRelatorBtype = (relator) =>
    {
            var query = `
            PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT ?element ?elementLabel ?type ?father ?fatherLabel WHERE 
            {
                <`+relator+`> puro:linkedTo ?element .
                ?element rdfs:label ?elementLabel . 
                {?element a puro:BObject}
                UNION
                {?element a puro:BType}
                OPTIONAL {?element puro:instanceOf ?father}
                OPTIONAL {?father rdfs:label ?fatherLabel}
               
            }`

            return new Promise(resolve => {
                this.sparqlQuery(query, function callback(result) {
                    resolve(result);
                  }); 
           });



    }

    findBTypeChild =  (fatherElement, returnArr,endCall) => 
        {
               
                var elementsUri = fatherElement.uri.value;
                
                var query = `
                 PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                 SELECT ?uri ?label ?father ?fatherType ?type ?relation ?connect ?connectFrom ?child ?childType WHERE 
                 {
                     {?uri puro:instanceOf <` +elementsUri+`>}
                     UNION
                     {?uri puro:subTypeOf <` +elementsUri+`>}
                     OPTIONAL {{?child puro:instanceOf ?uri} UNION {?child puro:subTypeOf ?uri}}
                     OPTIONAL {?child a ?childType}
                     ?uri ?relation <` +elementsUri+`> .
                     ?uri rdfs:label ?label .
                     ?uri a ?type . 
                     <` +elementsUri+`> a ?fatherType
                     OPTIONAL {?uri puro:linkedTo ?connect}
                     OPTIONAL {?connectFrom puro:linkedTo ?uri}
                     BIND ( <`+elementsUri+`>  AS ?father)
                 }`;
                this.sparqlQuery(query, function callback(result) {  
                    
                    var checkArr = []; 
                    var connect = [];

                    result = this.deleteDuplicity(result, ["connect", "connectFrom", "father", "fatherType","relation","child","childType"]);
            
                    if (result.length > 0)
                    {
                        // otestovat jak funguje v případě dvou 
                        for (let i in result) {
                            returnArr.push(result[i]);
                            this.findBTypeChild(result[i],returnArr,endCall);
                        
                        }
                    }
                    else
                    {
                        //POZOR MUZE BYT CHYB kvuli opakovani
                        endCall(returnArr);
                        //console.log(returnArr);
                        return returnArr;
                    }
                }.bind(this));          
             }

             getFullPath = () => 
             {
                 var query = `
                 PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                 SELECT ?uri ?label ?type ?connect  WHERE 
                 {
                     ?uri rdfs:label ?label .
                     ?uri a puro:BType . 
                     ?uri a ?type
                     OPTIONAL {?uri puro:linkedTo ?connect}
                     FILTER NOT EXISTS {?uri puro:linkedTo ?obj}
                     FILTER NOT EXISTS {?uri puro:subTypeOf ?object}
                 }`;
                 return new Promise(resolve => {

                  this.sparqlQuery(query, function callback(result) {
                      
                      this.recursiveFindChild(0,result,[], function lastCall(lastResult){
                             resolve(lastResult);
                     });
                 }.bind(this));
             });
             }

             recursiveFindChild = (i, result, bTypeTree,lastCall) => 
             {       
                 if(i === result.length)
                 {
                     lastCall(bTypeTree);
                     return bTypeTree;
                 }
                 else {
                     bTypeTree.push(result[i]);
                     this.findBTypeChild(result[i],bTypeTree, function endCall(final) {
                         i++;
                         this.recursiveFindChild(i++, result, bTypeTree,lastCall);    
                     }.bind(this));
                 }
    
             }

             sparqlQuery = (sparql, callback) => {
                var puroXML = this.puroXML;
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
                rdfstore.create( function(err, store) {
                     store.load("text/turtle", turtle, function(err, results) {
                        store.execute(sparql,
                          function(err, results) {
                          //console.log("ted");
                          //console.log(results);
                          
                          callback(results);
                            
                         // callback(results); 
                        });
                    });
                });
                 
            }; 

            findRelation = (elementUri) => {
                var query = `
                PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?uri ?label  WHERE 
                {
                  <`+elementUri+`> puro:linkedTo ?uri . 
                }`;
                
                return new Promise(resolve => {
                    this.sparqlQuery(query, function callback(result) {
                        resolve(result);
                    });
                  }); 

            }

            firstFind = async () => {
                //console.log(this.xmlText);
                
               // var rulesJson = this.rulesJson;
               // var result = [];
                var query = `
                PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?uri ?label  WHERE 
                {
                    ?uri rdfs:label ?label.
                    ?uri a puro:BType
                    FILTER NOT EXISTS {?uri puro:linkedTo ?obj}
                    FILTER NOT EXISTS {?uri puro:subTypeOf ?object}
                }`;
                
                return new Promise(resolve => {
                    this.sparqlQuery(query, function callback(result) {
                        resolve(result);
                    });
                  });       
            }

            //result[index].connect
            deleteDuplicity = (result, properties) => {
                var duplicity;
                var checkArr = []; 

                for (let index = result.length -1; index >= 0; index --) {
                
                    for (let property of properties)
                    {               
                        if (result[index][property] === null)
                        {
                            result[index][property] = [];    
                        }
                        else
                        {
                            result[index][property] = [result[index][property].value]; 
                        }        
                    }
                    
                    if (checkArr.includes(result[index].uri.value))
                    {
                        
                        for (let k = result.length -1; k >= 0; k --) {
                            for (let property of properties)
                            {
                                duplicity = result[index][property];    
                                if(result[k].uri.value === result[index].uri.value){     
                                    
                                    if(!Array.isArray(result[k][property]))
                                    {
                                        
                                        if (result[k][property] === null)
                                        {
                                            result[k][property] = [];    
                                        }
                                        else
                                        {
                                            result[k][property] = [result[k][property].value]; 
                                        }   
                                    }
                                    
                                    if (!duplicity.some(e => result[k][property].includes(e)))
                                    {

                                        if(property.includes("Type"))
                                        {
                                            if (result[k][property.split("Type")[0]].length === duplicity.length) {
                                                result[k][property] = result[k][property].concat(duplicity); 
                                                break;       
                                            }
                                        }
                                        else{
                                            result[k][property] = result[k][property].concat(duplicity); 
                                            break; 
                                        }

                                    }        
                                }   
                            }
                        }
                        result.splice(index, 1);
                    }
                    else
                    {
                        checkArr.push(result[index].uri.value);
                    } 
                }

                return result; 

            }


}