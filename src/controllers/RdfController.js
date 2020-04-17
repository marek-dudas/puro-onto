import $ from 'jquery';
import MainController from './MainController';


export default class RdfController extends MainController {
    
    constructor() {
        super(); 
        this.rdf = require('rdflib');
        let puro ;
        
        const modelURL = this.rulesJson["modelURL"].replace("MODELID", this.modelId)
        // puroOutput.xml
        $.ajax({
            type: "GET",
            url:   modelURL,
            async: false,
            cache: false,
            dataType: "xml",
            success: function(xml) {
          
                this.puroXML = xml;
                console.log(this.puroXML)
                puro = xml; 
            },
            error: function (jqXHR, textStatus, errorThrown) {
             alert("There is the problem to load serialized PURO model! \n" + errorThrown ); 
             //window.location.replace(document.referrer); 
            }
        });
        
        this.puroXML = puro; 
     
    }


    getRelatorBtype  (relator, fromUri) 
    {
            const query = `
            PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT ?element ?valuation ?elementLabel ?type ?father ?fatherLabel ?elementType ?fatherType WHERE 
            {
                {<`+relator+`> puro:linkedTo ?element . <`+fromUri+`> puro:linkedTo <`+relator+`>} 
                UNION
                {?element puro:linkedTo <`+relator+`> . <`+relator+`> puro:linkedTo <`+fromUri+`>}    
                {?element a puro:BObject}
                UNION
                {?element a puro:BType}
                ?element rdfs:label ?elementLabel .
                ?element a ?elementType .  
                OPTIONAL {?element puro:instanceOf ?father}
                OPTIONAL {?father rdfs:label ?fatherLabel}
                OPTIONAL {?father a ?fatherType}
                OPTIONAL {?uri puro:linkedTo ?valuation. ?valuation a puro:BValuation}
               
               
            }`

            return new Promise(resolve => {
                this.sparqlQuery(query, function callback(result) {
                     result = this.deleteDuplicity(result, ["valuation"])
                    result["relationName"] = relator; 
                    resolve(result);
                  }); 
           });



    }


    findBTypeRelation (fatherElement, returnArr,endCall)  
    {       

            const elementsUri = fatherElement.uri.value;
            const query = `
             PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
             PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
             SELECT ?uri ?label ?father ?fatherType ?type ?fatherTypeRelation ?connect ?connectFrom ?child ?childType ?childRel WHERE 
             {
                 {<` +elementsUri+`> puro:instanceOf ?uri }
                 UNION
                 {<` +elementsUri+`> puro:subTypeOf  ?uri }
                 ?uri a ?type . 
                 ?uri rdfs:label ?label .         
             }`;
            this.sparqlQuery(query, function callback(result) {  
                
                console.log(JSON.parse(JSON.stringify(result)));
                result = this.deleteDuplicity(result, ["connect", "connectFrom", "father", "fatherType","fatherTypeRelation","child","childType","childRel"]);
        
                if (result.length > 0)
                {
                    // otestovat jak funguje v případě dvou 
                    
                    for (let i in result) {
                        returnArr.push(result[i]);
                        this.findBTypeRelation(result[i],returnArr,endCall);
                    }
                }
                else
                {
                    //POZOR MUZE BYT CHYB kvuli opakovani
                    endCall(returnArr);
                    return returnArr;
                }
            }.bind(this));          
         }



    findBTypeChild  (fatherElement, returnArr,endCall) 
        {
                const elementsUri = fatherElement.uri.value;
                
                const query = `
                 PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                 SELECT ?uri ?valuation ?label ?father ?fatherType ?type ?fatherTypeRelation ?connect ?connectFrom ?child ?childType ?childRel WHERE 
                 {
                     {?uri puro:instanceOf <` +elementsUri+`>}
                     UNION
                     {?uri puro:subTypeOf <` +elementsUri+`>}
                     OPTIONAL {{?child puro:instanceOf ?uri} UNION {?child puro:subTypeOf ?uri}}
                     OPTIONAL {?child a ?childType}
                     OPTIONAL {{?child ?childRel ?uri} UNION {?child ?childRel ?uri}}
                     OPTIONAL {?uri puro:linkedTo ?valuation. ?valuation a puro:BValuation}
                     ?uri ?fatherTypeRelation <` +elementsUri+`> .
                     ?uri rdfs:label ?label .
                     ?uri a ?type . 
                     <` +elementsUri+`> a ?fatherType
                     OPTIONAL {?uri puro:linkedTo ?connect. ?connect a puro:BRelation}
                     OPTIONAL {?connectFrom puro:linkedTo ?uri. ?connectFrom a puro:BRelation}
                     BIND ( <`+elementsUri+`>  AS ?father)
                 }`;
                this.sparqlQuery(query, result => {  
                    this.debug(result);
                    result = this.deleteDuplicity(result, ["connect","connectFrom", "father", "fatherType","fatherTypeRelation","child","childType","childRel","valuation"]);
                
                    if (result.length > 0)
                    {
                        for (let i in result) {
                            returnArr.push(result[i]);
                            this.findBTypeChild(result[i],returnArr,endCall);
                        }
                    }
                    else
                    { 
                      
                        endCall(returnArr);
                        return returnArr;
                    }
                });          
             }

             getFullPath ()  
             {
                 const query = `
                 PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                 SELECT ?uri ?valuation ?label ?type ?connect ?child ?fatherType ?father ?fatherTypeRelation ?childType ?childRel WHERE 
                 {
                     ?uri rdfs:label ?label .
                     ?uri a puro:BType . 
                     ?uri a ?type
                     OPTIONAL {{?child puro:instanceOf ?uri} UNION {?child puro:subTypeOf ?uri} ?child a ?childType . ?child ?childRel ?uri . } 
                     OPTIONAL {?uri puro:linkedTo ?connect. ?connect a puro:BRelation}
                     OPTIONAL {?uri puro:linkedTo ?valuation. ?valuation a puro:BValuation}
                     FILTER NOT EXISTS {?uri puro:subTypeOf ?object}
                     FILTER NOT EXISTS {?uri puro:instanceOf ?object}
                 }`;
                 return new Promise(resolve => {
                  
                  // instance může mít mnohem více dětí!!!! zaměř se na to a dej si na to pozor!!!
                  this.sparqlQuery(query, result => {
                      result.forEach(function(node) {
                            
                            node.father = [];
                            node.fatherType = [];
                            node.fatherTypeRelation = [];
                            // tady to nastav ve SPARQ 
                            node["connectFrom"] = [];
                    });
                  
                      this.deleteDuplicity(result,["valuation", "connect", "childType", "child", "childRel"]);
                      this.recursiveFindChild(0,result,[], lastResult => {
                             lastResult = this.deleteDuplicityInFinal(lastResult);
                             lastResult = this.uniquePropertie(lastResult);
                             resolve(lastResult);
                     });
                 });
             });
             }

             uniquePropertie (elements)
             {
                for (let element of elements)
                {
                    for (let prop in element)
                    {
                        if (Array.isArray(element[prop]))
                        {
                            element[prop] = element[prop].filter(function(item, pos) {
                                return element[prop].indexOf(item) === pos;
                            })
                        }
                    }
                }

                return elements; 
             }

             deleteDuplicityInFinal (elements)
             {
                for (let i = 0; i < elements.length; i++) {
                    for (let j = 0; j < elements.length; j++) {
                        if (elements[i].uri.value === elements[j].uri.value && i !== j)
                        {
                            for (let property in elements[i])
                            {
                                if (Array.isArray(elements[i][property]))
                                {
                                   //raassss
                                   elements[j][property] = elements[j][property].filter(e => e !== elements[i][property]); 
                                   elements[i][property] = elements[i][property].concat(elements[j][property]); 
                                }
                            }

                            elements.splice(j, 1);
                        }            
                    }   
                }

                return elements; 
             }

             recursiveFindChild (i, result, bTypeTree,lastCall, type)
             {      
                 //last change 
                 if(i >= result.length)
                 {
                     lastCall(bTypeTree);
                     return bTypeTree;
                 }
                 else {
                     bTypeTree.push(result[i]);
                     if (type === "relation")
                     {
                        this.findBTypeRelation(result[i],bTypeTree, final => {
                            i++;
                            this.recursiveFindChild(i++, result, bTypeTree,lastCall, "relation");    
                        });
                     }
                     else
                     {
                        this.findBTypeChild(result[i],bTypeTree,  final => {
                            i++;
                            this.recursiveFindChild(i++, result, bTypeTree,lastCall, type);    
                        });
                     }

                 }
    
             }

             sparqlQuery (sparql, callback)  {
                const puroXML = new XMLSerializer().serializeToString(this.puroXML);
               
                const store = this.rdf.graph();
                const contentType = 'application/rdf+xml';
                const baseUrl = "http://lod2-dev.vse.cz/";
                
                this.rdf.parse(puroXML, store, baseUrl, contentType); 
        
                var turtle;
                 this.rdf.serialize(undefined, store, "http://www.w3sds.org/1999/02/22-rdf-syntax-ns#type", 'text/turtle', function(err, str){
                    turtle = str;
                })
        
                const rdfstore = require('rdfstore');
                rdfstore.create( function(err, store) {
                     store.load("text/turtle", turtle, function(err, results) {
                        store.execute(sparql,
                          function(err, results) {
                          callback(results);
                            
                        });
                    });
                });
                 
            }; 


     
            //from nebo to poslat si ukazatel? 
            getRelationBTypes (relationUri) 
            {
                let query = `
                 PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                 SELECT  ?uri ?type ?label  WHERE 
                 {
                     {<`+relationUri+`> puro:instanceOf ?uri}
                     UNION
                     {<`+relationUri+`> puro:subTypeOf ?uri}
                     ?uri a ?type .
                     ?uri rdfs:label ?label
                 }`; 

                 return new Promise(resolve => {
                    // instance může mít mnohem více dětí!!!! zaměř se na to a dej si na to pozor!!!
                    this.sparqlQuery(query, (result) => {
                        // result.push({uri: {token:"uri", value: relationUri}});
                        console.log(result);
                        this.recursiveFindChild(0,result,[], function lastCall(lastResult){
                               resolve(lastResult);
                       },"relation");
                   });
                });


            }

            //začátek hlavního
            getRelations  () 
            {
                // ještě by to chtělo sjednotit do pole 
                const query = `
                PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?uri ?valuation ?from ?to ?toType ?fromType ?label ?type  WHERE 
                {
                  ?uri a puro:BRelation . 
                  ?from puro:linkedTo ?uri .
                  ?uri puro:linkedTo ?to .
                  ?uri rdfs:label ?label . 
                  ?uri a ?type .
                  OPTIONAL {?uri puro:linkedTo ?valuation. ?valuation a puro:BValuation} 
                  FILTER NOT EXISTS{?to a puro:BAttribute}
                  FILTER NOT EXISTS{?from a puro:BAttribute}
                  FILTER NOT EXISTS{?to a puro:BValuation}
                  FILTER NOT EXISTS{?from a puro:BValuation}
                  ?to a ?toType . 
                  ?from a ?fromType .
                }`;

                /*
                                var query = `
                PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?uri ?valuation ?from ?to ?toType ?fromType ?label ?type  WHERE 
                {
                  ?uri a puro:BRelation . 
                  ?from puro:linkedTo ?uri .
                  ?uri puro:linkedTo ?to .
                  ?uri rdfs:label ?label . 
                  ?uri a ?type .
                  OPTIONAL {?uri puro:linkedTo ?valuation. ?valuation a puro:BValuation}
                  {?from a puro:BObject}
                  UNION 
                  {?from a puro:BType}
                  {?to a puro:BObject}
                  UNION
                  {?to a puro:BType}   
                  ?to a ?toType . 
                  ?from a ?fromType . 
                }`; */
                
                return new Promise(resolve => {
                    this.sparqlQuery(query, function callback(result) {
                        result = this.deleteDuplicity(result,[ "from", "to", "toType", "fromType", "valuation"]);
                        console.log(result)
                        resolve(result);
                    }.bind(this));
                  }); 
            }

            findRelation  (elementUri) {
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

            async firstFind  ()  {
                var query = `
                PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?uri ?label ?child WHERE 
                {
                    {?child puro:instanceOf ?uri}
                     UNION
                    {?child puro:subTypeOf ?uri}
                    ?uri rdfs:label ?label. asfadf
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
            deleteDuplicity  (result, properties) {
                var duplicity;
                var checkArr = []; 
                
                // sjednocení datových typů na pole
                for (var res of result)
                {
                    for (let property of properties)
                    {               
                        if (res[property] === null)
                        {
                            res[property] = [];    
                        }
                        else
                        {
                            res[property] = [res[property].value]; 
                        }        
                    }
                }

                for (let index = result.length -1; index >= 0; index --) {
                    
                    if (checkArr.includes(result[index].uri.value))
                    {
                            for (let property of properties)
                            {
                                for (let k = result.length -1; k >= 0; k --) {
                                duplicity = result[index][property];    
                                if(result[k].uri.value === result[index].uri.value){     
                                    
                                    if (!duplicity.some(e => result[k][property].includes(e)))
                                    {                                    
                                        result[k][property] = result[k][property].concat(duplicity); 
                                        break;
                                    }
                                    else{
                                        if(property.includes("Type"))
                                        {
                                            if (result[k][property.split("Type")[0]].length !== result[k][property].length) {
                                                result[k][property] = result[k][property].concat(duplicity); 
                                                break; 
                                            }
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