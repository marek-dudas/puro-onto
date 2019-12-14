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


    getRelatorBtype = (relator, fromUri) =>
    {
            var query = `
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
                   // result = this.deleteDuplicity(result, ["valuation"])
                    result["relationName"] = relator; 
                    resolve(result);
                  }); 
           });



    }


    findBTypeRelation =  (fatherElement, returnArr,endCall) => 
    {
           
            var elementsUri = fatherElement.uri.value;
            var query = `
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
                
                var checkArr = []; 
                var connect = [];

                result = this.deleteDuplicity(result, ["connect", "connectFrom", "father", "fatherType","fatherTypeRelation","child","childType","childRel"]);
        
                if (result.length > 0)
                {
                    // otestovat jak funguje v případě dvou 
                    for (let i in result) {
                        console.log(result)
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



    findBTypeChild =  (fatherElement, returnArr,endCall) => 
        {
               
                var elementsUri = fatherElement.uri.value;
                
                var query = `
                 PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                 SELECT ?uri ?valuation ?valuationLabel ?label ?father ?fatherType ?type ?fatherTypeRelation ?connect ?connectFrom ?child ?childType ?childRel WHERE 
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
                     OPTIONAL {?uri puro:linkedTo ?connect}
                     OPTIONAL {?connectFrom puro:linkedTo ?uri}
                     BIND ( <`+elementsUri+`>  AS ?father)
                 }`;
                this.sparqlQuery(query, function callback(result) {  
                    
                    var checkArr = []; 
                    var connect = [];

                    result = this.deleteDuplicity(result, ["connect","valuation","connectFrom", "father", "fatherType","fatherTypeRelation","child","childType","childRel"]);
            
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
                        return returnArr;
                    }
                }.bind(this));          
             }

             getFullPath = () => 
             {
                 var query = `
                 PREFIX puro: <http://lod2-dev.vse.cz/ontology/puro#>
                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                 SELECT ?uri ?valuation ?label ?type ?connect ?child ?fatherType ?father ?fatherTypeRelation ?childType ?childRel WHERE 
                 {
                     {?child puro:instanceOf ?uri}
                     UNION
                     {?child puro:subTypeOf ?uri}
                     ?child a ?childType .
                     ?child ?childRel ?uri . 
                     ?uri rdfs:label ?label .
                     ?uri a puro:BType . 
                     ?uri a ?type
                     OPTIONAL {?uri puro:linkedTo ?connect}
                     OPTIONAL {?uri puro:linkedTo ?valuation. ?valuation a puro:BValuation}
                     FILTER NOT EXISTS {?uri puro:linkedTo ?obj}
                     FILTER NOT EXISTS {?uri puro:subTypeOf ?object}
                 }`;
                 return new Promise(resolve => {
                  
                  // instance může mít mnohem více dětí!!!! zaměř se na to a dej si na to pozor!!!
                  this.sparqlQuery(query, function callback(result) {
                      
                      result.forEach(function(node) {
                            node.father = [];
                            node.fatherType = [];
                            node.fatherTypeRelation = [];
                            node.childType = [node.childType.value];
                            node.child = [node.child.value];
                            node.childRel = [node.childRel.value];
                            if (node.connect) {
                                node.connect = [node.connect.value]
                            }
                            else
                            {
                                node.connect = [];
                            }
                            // tady to nastav ve SPARQ 
                            node["connectFrom"] = [];
                    });
                      this.deleteDuplicity(result,["valuation"]);
                      this.recursiveFindChild(0,result,[], function lastCall(lastResult){
                             resolve(lastResult);
                     });
                 }.bind(this));
             });
             }

             recursiveFindChild = (i, result, bTypeTree,lastCall, type) => 
             {       
                 if(i === result.length)
                 {
                     lastCall(bTypeTree);
                     return bTypeTree;
                 }
                 else {
                     bTypeTree.push(result[i]);
                     if (type === "relation")
                     {
                        this.findBTypeRelation(result[i],bTypeTree, function endCall(final) {
                            i++;
                            this.recursiveFindChild(i++, result, bTypeTree,lastCall, "relation");    
                        }.bind(this));
                     }
                     else
                     {
                       
                        this.findBTypeChild(result[i],bTypeTree, function endCall(final) {
                            i++;
                            this.recursiveFindChild(i++, result, bTypeTree,lastCall, type);    
                        }.bind(this));
                     }

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
                          callback(results);
                            
                        });
                    });
                });
                 
            }; 



            //from nebo to poslat si ukazatel? 
            getRelationBTypes = (relationUri) => 
            {
                
                var query = `
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
                    this.sparqlQuery(query, function callback(result) {
                        
                        // result.push({uri: {token:"uri", value: relationUri}});
                        
                        this.recursiveFindChild(0,result,[], function lastCall(lastResult){
                               resolve(lastResult);
                       },"relation");
                   }.bind(this));
                });


            }

            //začátek hlavního
            getRelations = () => 
            {
                // ještě by to chtělo sjednotit do pole 
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
                }`;
                
                return new Promise(resolve => {
                    this.sparqlQuery(query, function callback(result) {
                        result = this.deleteDuplicity(result,["valuation", "from", "to", "toType", "fromType"]);
                        console.log(result)
                        resolve(result);
                    }.bind(this));
                  }); 
            }

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
            deleteDuplicity = (result, properties) => {
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