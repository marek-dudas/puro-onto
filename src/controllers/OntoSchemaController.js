
export default class OntoScheController {

    /*
    constructor()
    {

       const mod = this.initJson();
       console.log(mod)
       const model = this.transform(mod);



         console.log(model);
        const schemas = require('ontouml-schema');
        const Ajv = require('ajv');
        const validator = new Ajv().compile(schemas.getSchema(schemas.ONTOUML_2));
        this.ontoModel = this.initJson();
       
        const isValid = validator(model);

        if (isValid)
        {
          console.log("ok")
        }
        else
        {
          console.log(validator.errors);
        }
    } */

    transform (ontoModel)
    {
        const ontoUmlSchema = this.schemaInit(); 
        let relCount = 0; 

        for (let node of ontoModel)
        {
            if(node.type === "Class" || node.ontoType.toLowerCase() === "relator")
            {
              ontoUmlSchema["contents"].push(this.ontoClassTransformation(node)); 
            }
        }
        console.log(ontoUmlSchema)
        // Relations have to be added at the end 
        for (let node of ontoModel)
        {
          if (node.type === "relation" && node.ontoType.toLowerCase() !== "relator") {
              let key; 
              
              if (node.from.length >= node.to.length)
              {
                 key = "from";
              }
              else
              {
                key = "to"; 
              }
              
              let opositeIndex = 0;
              for (let index in node[key])
              {
                 
                 let fromIndex = key === "from" ? index : opositeIndex; 
                 let toIndex = key === "to" ? index : opositeIndex; 
                  
                 ontoUmlSchema["contents"].push(this.relationTransformation(node, relCount, fromIndex, toIndex));
                 relCount += 2;  
                 if (index <= node[key].length)
                 {
                    opositeIndex = index; 
                 }
              }
          }
          else if (node.ontoType.toLowerCase() === "relator")
          {
            let nodeCopy = JSON.parse(JSON.stringify(node));
            let nodeCopy2 = JSON.parse(JSON.stringify(node));  
            
            let key; 
              
            if (node.from.length >= node.to.length)
            {
               key = "from";
            }
            else
            {
              key = "to"; 
            }
            
            let opositeIndex = 0;

            for (let index in node[key])
            {
              nodeCopy["uri"] += "rel1"
              nodeCopy2["uri"] += "rel2"
        
              nodeCopy["ontoType"] += "mediation"
              nodeCopy2["ontoType"] += "mediation"
              
              if (key === "from")
              {
                nodeCopy["fromType"] = node["fromType"][index][0]; 
                nodeCopy["toType"] = node["fromType"][index][1];

                nodeCopy2["fromType"] = node["toType"][opositeIndex][0];
                nodeCopy2["toType"] = node["toType"][opositeIndex][1];
                
                nodeCopy["from"] = [nodeCopy["from"][index]];
                nodeCopy2["to"] = [nodeCopy["to"][opositeIndex]];

              }
              else
              {
                nodeCopy["fromType"] = node["fromType"][opositeIndex][0]; 
                nodeCopy["toType"] = node["fromType"][opositeIndex][1];

                nodeCopy2["fromType"] = node["toType"][index][0];
                nodeCopy2["toType"] = node["toType"][index][1];
                
                nodeCopy["from"] = [nodeCopy["from"][opositeIndex]];
                nodeCopy2["to"] = [nodeCopy["to"][index]];
              }
              
              nodeCopy["to"] = [node.uri];
              nodeCopy2["from"] = [node.uri];
              
              ontoUmlSchema["contents"].push(this.relationTransformation(nodeCopy, relCount, 0,0));
              relCount += 2;
  
              ontoUmlSchema["contents"].push(this.relationTransformation(nodeCopy2, relCount,0,0));
              relCount += 2;  
              
              if (index <= node[key].length)
              {
                 opositeIndex = index; 
              }
            }
          }
        }

        const schemas = require('ontouml-schema');
        const Ajv = require('ajv');
        const validator = new Ajv().compile(schemas.getSchema(schemas.ONTOUML_2));
        this.ontoModel = this.initJson();
       
        const isValid = validator(ontoUmlSchema);

        if (isValid)
        {
          return ontoUmlSchema; 
        }
        else
        {
          alert("Model is not valid! Check OntoSchemaCotroller!"); 
        }
    }

    schemaInit ()
    {
        return {
            "type": "Package",
            "id": "puroConversion",
            "name": null,
            "description": null,
            "contents": [],
            "propertyAssignments": null
            }
    }

    ontoClassTransformation (ontoClass)
    {
      return  {
            "type": "Class",
            "id": ontoClass.uri ,
            "name": ontoClass.label,
            "description": null,
            "properties": null,
            "literals": null,
            "propertyAssignments": null,
            "stereotypes": [ontoClass.ontoType.toLowerCase()],
            "isAbstract": null,
            "isDerived": null
            }
    }

    relationTransformation (relation, relCount, fromIndex, toIndex)
    {

        if (relation.ontoType === "Generalization")
        {
             return {
                "type": "Generalization",
                "id": relation.uri,
                "name": null,
                "description": null,
                "general": {
                  "type": "Class",
                  "id": relation.from[fromIndex]
                },
                "specific": {
                  "type": "Class",
                  "id": relation.to[toIndex]
                },
                "propertyAssignments": {
                  "nonStandardProperty": null
                }
              };
        }
        else
        {
            return {
              "type": "Relation",
              "id": relation.uri,
              "name": null,
              "description": null,
              "properties": [
                {
                  "type": "Property",
                  "id": "prop" + relCount,
                  "name": null,
                  "description": null,
                  "propertyType": {
                    "type": "Class",
                    "id": relation.from[fromIndex]
                  },
                  "cardinality": relation.fromType[fromIndex] === "" || undefined ? null : relation.fromType[fromIndex],
                  "isDerived": null,
                  "isOrdered": null,
                  "isReadOnly": null,
                  "stereotypes": null,
                  "propertyAssignments": null,
                  "subsettedProperties": null,
                  "redefinedProperties": null,
                  "aggregationKind": null
                },
                {
                  "type": "Property",
                  "id": "prop" + (parseInt(relCount) + 1),
                  "name": null,
                  "description": null,
                  "propertyType": {
                    "type": "Class",
                    "id": relation.to[toIndex]
                  },
                  "cardinality": relation.toType[toIndex] === "" || undefined ? null : relation.toType[toIndex],
                  "isDerived": null,
                  "isOrdered": null,
                  "isReadOnly": null,
                  "stereotypes": null,
                  "propertyAssignments": null,
                  "subsettedProperties": null,
                  "redefinedProperties": null,
                  "aggregationKind": null
                }
              ],
              "propertyAssignments": {
                "nonStandardProperty": null
              },
              "stereotypes": [relation.ontoType.toLowerCase()],
              "isAbstract": true,
              "isDerived": false
            }
        }


    }

    initJson()
    {
      return JSON.parse(`[
        {
          "type": "relation",
          "ontoType": "Characterization",
          "from": [
            "http://lod2-dev.vse.cz/data/puromodels#Book"
          ],
          "to": [
            "http://lod2-dev.vse.cz/data/puromodels#Topic"
          ],
          "uri": "http://lod2-dev.vse.cz/data/puromodels#has_topic",
          "label": "has_topic",
          "fromType": [
            "1"
          ],
          "toType": [
            "1"
          ],
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/puromodels#Book",
          "label": "Book",
          "ontoType": "Kind",
          "puroType": "BType",
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#has_topic",
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "direction": [
            "from",
            "from"
          ],
          "from": [
            null
          ],
          "to": [
            null
          ],
          "type": "Class",
          "branchIndex": [
            1
          ]
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/puromodels#Topic",
          "label": "Topic",
          "ontoType": "Mode",
          "puroType": "BType",
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#has_topic"
          ],
          "direction": [
            "to"
          ],
          "from": [
            null
          ],
          "to": [
            null
          ],
          "type": "Class",
          "branchIndex": [
            1
          ]
        },
        {
          "type": "relation",
          "ontoType": "Generalization",
          "from": [
            "http://lod2-dev.vse.cz/data/puromodels#Topic"
          ],
          "to": [
            "http://lod2-dev.vse.cz/data/puromodels#DDC_Topic"
          ],
          "uri": "http://lod2-dev.vse.cz/data/ontomodels/relation/Generalization/TopicDDC_Topic",
          "label": "nazev",
          "fromType": [
            ""
          ],
          "toType": [
            ""
          ],
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/puromodels#DDC_Topic",
          "label": "DDC_Topic",
          "ontoType": "Subkind",
          "puroType": "BType",
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#has_topic"
          ],
          "direction": [
            "to"
          ],
          "from": [
            null
          ],
          "to": [
            null
          ],
          "type": "Class",
          "branchIndex": [
            1
          ]
        },
        {
          "type": "relation",
          "ontoType": "Relator",
          "from": [
            "http://lod2-dev.vse.cz/data/ontomodels#q"
          ],
          "to": [
            "http://lod2-dev.vse.cz/data/puromodels#Location"
          ],
          "uri": "http://lod2-dev.vse.cz/data/puromodels#published_in",
          "label": "published_in",
          "fromType": [
            [
              "1",
              "1"
            ]
          ],
          "toType": [
            [
              "1",
              "1"
            ]
          ],
          "fromRelation": []
        },
        {
          "type": "relation",
          "ontoType": "Generalization",
          "from": [
            "http://lod2-dev.vse.cz/data/puromodels#Book"
          ],
          "to": [
            "http://lod2-dev.vse.cz/data/ontomodels#q"
          ],
          "uri": "http://lod2-dev.vse.cz/data/ontomodels/relation/Generalization/Bookq",
          "label": "nazev",
          "fromType": [
            ""
          ],
          "toType": [
            ""
          ],
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/ontomodels#q",
          "label": "q",
          "ontoType": "Role",
          "puroType": false,
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "direction": [
            "from"
          ],
          "from": [
            null
          ],
          "to": [
            null
          ],
          "type": "Class",
          "branchIndex": [
            1
          ]
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/ontomodels#w",
          "label": "w",
          "ontoType": "Datatype",
          "puroType": "BValue",
          "fromRelation": [
            {
              "token": "uri",
              "value": "http://lod2-dev.vse.cz/data/puromodels#published_in"
            }
          ],
          "direction": [
            "from"
          ],
          "from": [
            null
          ],
          "to": [
            null
          ],
          "type": "Class",
          "branchIndex": [
            null
          ]
        },
        {
          "type": "relation",
          "ontoType": "connect",
          "from": [
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "to": [
            "http://lod2-dev.vse.cz/data/ontomodels#w"
          ],
          "uri": "http://lod2-dev.vse.cz/data/ontomodels/relation/connect/published_inw",
          "label": "nazev",
          "fromType": [
            "*"
          ],
          "toType": [
            "*"
          ],
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/puromodels#Location",
          "label": "Location",
          "ontoType": "Role",
          "puroType": "BType",
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "direction": [
            "to"
          ],
          "from": [
            null
          ],
          "to": [
            null
          ],
          "type": "Class",
          "branchIndex": [
            1
          ]
        },
        {
          "type": "relation",
          "ontoType": "Generalization",
          "from": [
            "http://lod2-dev.vse.cz/data/ontomodels#e"
          ],
          "to": [
            "http://lod2-dev.vse.cz/data/puromodels#Location"
          ],
          "uri": "http://lod2-dev.vse.cz/data/ontomodels/relation/Generalization/eLocation",
          "label": "nazev",
          "fromType": [
            ""
          ],
          "toType": [
            ""
          ],
          "fromRelation": []
        },
        {
          "uri": "http://lod2-dev.vse.cz/data/ontomodels#e",
          "label": "e",
          "ontoType": "Kind",
          "puroType": false,
          "fromRelation": [
            "http://lod2-dev.vse.cz/data/puromodels#published_in"
          ],
          "direction": [
            "to"
          ],
          "from": [
            null
          ],
          "to": [
            null
          ],
          "type": "Class",
          "branchIndex": [
            1
          ]
        }
      ]`); 
    }
}