import jsonData from './rules.json';

import $ from 'jquery';

export default class RuleController {


    constructor() {

       
        var puro ;
        
        $.ajax({
            type: "GET",
            url: "http://localhost:3000/puroOutput.xml",
            async: false,
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
                    */
                    // this.setState(buttons: [])
                }
                else if (linkedElement[0].tagName == "puro:BType") {

                }
                else if (linkedElement[0].tagName == "puro:Attribute") {

                }

            });
        });
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

