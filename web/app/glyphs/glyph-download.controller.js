(function () {

  angular.module('glyphMinerApp.glyphs').controller('GlyphDownloadController', GlyphDownloadController);
  
  GlyphDownloadController.$inject = ['$scope', 'filterFilter', 'orderByFilter', 'DocumentService'];
  
  function GlyphDownloadController($scope, filterFilter, orderByFilter, DocumentService) {
    var vm = this;

    vm.jsonGlyphs = jsonGlyphs;
    vm.csvGlyphs = csvGlyphs;
    vm.pageXMLGlyphs = pageXMLGlyphs;
    vm.zipGlyphImages = zipGlyphImages;
    
    ////////////////

    function getSelectedGlyphs() {
      return orderByFilter(filterFilter($scope.glyphList.glyphs, $scope.glyphList.filterGlyph), "-score");
    }

    function jsonGlyphs() {
      // create JSON representation of selected glyphs and save it
      var jsonString = angular.toJson(getSelectedGlyphs());
      var jsonBlob = new Blob([jsonString], {type: "text/plain;charset=utf-8"})
      saveAs(jsonBlob, "glyphs.json", true);
    }
    
    function csvGlyphs() {
      // create CSV representation of selected glyphs and save it
      var csvString = "";
      var selectedGlyphs = getSelectedGlyphs();
      for (var i = 0; i < selectedGlyphs.length; i++) {
        var glyph = selectedGlyphs[i];
        
        // print table header (first line)
        if (i == 0) {
          for (var property in glyph)
            if (!property.contains('$$'))
              csvString += property + ",";
          csvString += "\n";
        }
        
        // print property values
        for (var property in glyph) {
          if (!property.contains('$$'))
            csvString += glyph[property] + ",";
        }
        csvString += "\n";
      }
      var csvBlob = new Blob([csvString], {type: "text/plain;charset=utf-8"})
      saveAs(csvBlob, "glyphs.csv", true);
    }
    
    function pageXMLGlyphs() {
      DocumentService.getDocuments().then(function (data) {
        pageXMLBuild(data);
      });
    }
    
    function pageXMLBuild(documents) {
      // one XML file per image, so we zip them
      var zip = new JSZip();
      var folder = zip.folder("pagexml");
      
      var timestamp = new Date().toISOString().slice(0,19);
      var xmlFiles = {};
    
      // iterate over selected glyphs
      var selectedGlyphs = getSelectedGlyphs();
      for (i = 0; i < selectedGlyphs.length; i++) {
        glyph = selectedGlyphs[i];
        
        // if we have not looked at this image before, start a new page XML document
        if (!xmlFiles.hasOwnProperty(glyph.image_id)) {
          var doc;
          for (j = 0; j < documents.length; j++)
            if (documents[j].id == glyph.image_id)
              doc = documents[j];
        
          var pageXMLHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
          pageXMLHeader += '<PcGts xmlns="http://schema.primaresearch.org/PAGE/gts/pagecontent/2010-03-19" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schema.primaresearch.org/PAGE/gts/pagecontent/2010-03-19 http://schema.primaresearch.org/PAGE/gts/pagecontent/2010-03-19/pagecontent.xsd">\n';
          pageXMLHeader += '<Metadata>\n<Creator></Creator>\n';
          pageXMLHeader += '<Created>' + timestamp + '</Created>\n<LastChange>' + timestamp + '</LastChange>\n';
          pageXMLHeader += '</Metadata>\n';
          pageXMLHeader += '<Page imageFilename="' + doc.path +'" imageWidth="' + doc.w + '" imageHeight="'+ doc.h +'">\n';
          xmlFiles[glyph.image_id] = pageXMLHeader;
        }
        
        // generate <Coords> element according to glyphs' coordinates
        var coords = '<Coords>\n';
	      coords += '<Point x="' +  glyph.x            +'" y="' +  glyph.y            +'"/>\n';
        coords += '<Point x="' + (glyph.x + glyph.w) +'" y="' +  glyph.y            +'"/>\n';
	      coords += '<Point x="' + (glyph.x + glyph.w) +'" y="' + (glyph.y + glyph.h) +'"/>\n';
	      coords += '<Point x="' +  glyph.x            +'" y="' + (glyph.y + glyph.h) +'"/>\n';
	      coords += '</Coords>\n';
	    
	      // create surrounding elements (required by schema)
        var pageXMLString = '<TextRegion id="tr' + glyph.id + '">\n' + coords;
        pageXMLString += '<TextLine id="tl' + glyph.id +'">\n' + coords;
        pageXMLString += '<Word id="w' + glyph.id + '">\n' + coords;
        
        // create glyph element
        pageXMLString += '<Glyph id="g'+ glyph.id +'">\n' + coords;
	      pageXMLString += '<TextEquiv>\n<PlainText></PlainText>\n';
	      pageXMLString += '<Unicode>'+ glyph.glyph +'</Unicode>\n</TextEquiv>';
        pageXMLString += '</Glyph></Word></TextLine></TextRegion>\n';
        xmlFiles[glyph.image_id] += pageXMLString;
      }
      
      // finish XML files, close remaining tags, and write to zip file
      for (var xmlFile in xmlFiles) {
        if (xmlFiles.hasOwnProperty(xmlFile)) {
          var xmlString = xmlFiles[xmlFile];
          xmlString += '</Page>\n</PcGts>\n';
          folder.file(xmlFile + ".xml", xmlString);
        }
      }
      
      var content = zip.generate({type:"blob"});
      saveAs(content, "pagexml.zip");
    }

    function zipGlyphImages() {
      // build new zip file
      var zip = new JSZip();
      var img = zip.folder("images");
      
      // get all selected glyph images and add them to the archive
      var selectedGlyphs = getSelectedGlyphs();
      console.log(selectedGlyphs.length);
      for (var i = 0; i < selectedGlyphs.length; i++) {
        var glyph = selectedGlyphs[i];
        var imgElement = document.querySelector('#match-' + glyph.id);
        var base64img = getBase64Image(imgElement);
        if ($scope.glyphList.filter.groupGlyphs) {
          var path = (glyph.glyph !== null && glyph.glyph.length > 0) ? glyph.glyph : "undefined";
          img.file(path + "/glyph-" + i + "-id-" + glyph.id + ".png", base64img, {base64: true, createFolders: true});
        } else
          img.file("glyph-" + i +".png", base64img, {base64: true});
      }
      
      // write zip file
      var content = zip.generate({type:"blob"});
      saveAs(content, "glyphs.zip");
    }

    function getBase64Image(img) {
      // Create an empty canvas element
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      // Copy the image contents to the canvas
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Get the data-URL formatted image
      var dataURL = canvas.toDataURL("image/png");

      return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    };

  }    
}());

