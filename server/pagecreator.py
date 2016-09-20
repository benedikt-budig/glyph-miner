""" Page Creator Backend Module """

import os
import random
import shutil
import uuid
import zipfile
from PIL import Image

def getMatches(template, db, imageList):
    """ Returns a list of all typesettable matches for a given template """
    # start with an empty list
    matches = []

    # iterate over all matches for the given template that are available in the database
    for match in db.query("SELECT m.*, t.glyph, l.label_value, i.path " +
                          "FROM images i, templates t, matches m " +
                          "LEFT OUTER JOIN labels l ON l.match_id = m.id " +
                          "WHERE m.template_id = t.id " +
                          "AND i.id = m.image_id " +
                          "AND t.id = " + str(template.id) + " " +
                          "ORDER BY m.image_id"):

        # take only matches that are classified as correct and are not disabled
        if match.label_value == "user_negative" or match.score < template.thresh_score or match.disabled == True:
            continue

        # handle offsets
        if template.leftcrop != None and template.leftcrop > 0:
            match.x = match.x + template.leftcrop
            match.w = match.w - template.leftcrop
        if template.rightcrop != None and template.rightcrop > 0:
            match.w = match.w - template.rightcrop

        # get image for this match

        if (match.image_id not in imageList):
            im = Image.open('./images/' + match.path)
            im.load()
            imageList[match.image_id] = im
        im = imageList[match.image_id]

        match.image = im.crop((int(match.x),
                               int(match.y),
                               int(match.x) + int(match.w),
                               int(match.y) + int(match.h)))

        # handle paddings, if necessary
        leftPadding = rightPadding = 0
        if template.leftcrop != None and template.leftcrop < 0:
            leftPadding = -template.leftcrop
        if template.rightcrop != None and template.rightcrop < 0:
            rightPadding = -template.rightcrop
        if leftPadding != 0 or rightPadding != 0:
            match.w = match.w + leftPadding + rightPadding
            paddedImage = Image.new("RGB", (match.w, match.h), "white")
            paddedImage.paste(match.image, (leftPadding, 0))
            match.image = paddedImage

        # copy baseline information for later use
        match.baseline = template.baseline

        # append this match to the list
        matches.append(match)

    return matches


def createLine(text, matches, xMargin, yOffset, line_height, page_dimensions, word_spacing, letter_spacing):
    """ Creates an image for one given line of text """

    boxes = []
    cursorX = xMargin
    lineImage = Image.new("RGB", (page_dimensions[0], line_height), "white")
    for char in text:
        # handle (white) space
        if char == " ":
            cursorX += word_spacing
            continue

        # dummy image if no glyphs available
        if not char in matches:
            print "missing glyph: " + char.encode('utf-8')
            im = Image.open('./missing-glyph.png')
            lineImage.paste(im, (cursorX, 0))
            cursorX += 50 + letter_spacing
            continue

        # draw a random representative for the character and handle its baseline
        glyph = random.choice(matches[char])
        baseline = glyph.baseline if glyph.baseline != None else glyph.h * 2.0 / 3.0
        lineImage.paste(glyph.image, (cursorX, int(line_height * 2.0 / 3.0) - int(baseline)))

        # save information for box file: (char, left, bottom, right, top)
        boxes.append((char,
                      cursorX,
                      page_dimensions[1] - (yOffset + (int(line_height * 2.0 / 3.0) - int(baseline)) + glyph.h),
                      cursorX + glyph.w,
                      page_dimensions[1] - (yOffset + (int(line_height * 2.0 / 3.0) - int(baseline)))))
        cursorX += glyph.w + letter_spacing
    return lineImage, boxes

def savePage(pageIndex, pageImage, boxes, workDir):
    """ Saves a page, including image and metadata, to the disk """
    pageImage.save('../web/synthetic_pages/' + workDir + str(pageIndex) + '.tiff', "TIFF")
    with open('../web/synthetic_pages/' + workDir + str(pageIndex) + '.box', 'w') as box_file:
        for box in boxes:
            box_file.write("{} {} {} {} {}\n".format(box[0].encode('utf-8'), box[1], box[2], box[3], box[4]))
    return

def createLines(matches, line_height, text, dimensions, margin, letter_spacing, word_spacing, baseline_skip, db, imageList):
    """ Builds a zip archive containing only synthetic lines for the given text """

    # generate random prefix for temporary working directory
    workDir = str(uuid.uuid4()) + '/'
    os.mkdir('../web/synthetic_pages/' + workDir)

    # keep track of the lines
    lineCount = 0

    # iterate over the lines
    for line in text.split("\n"):
        # skip over empty lines
        if line == "": continue

        # construct line image
        lineImage, lineBoxes = createLine(line, matches, margin[0], 0, line_height, dimensions, word_spacing, letter_spacing)

        # trim line image
        right_end = lineBoxes[-1][3] + margin[0]
        lineImage = lineImage.crop((0, 0, right_end, line_height))

        # save line image and line text
        lineImage.save('../web/synthetic_pages/' + workDir + str(lineCount) + '.png', "PNG")
        with open('../web/synthetic_pages/' + workDir + str(lineCount) + '.gt.txt', 'w') as gt_text_file:
            gt_text_file.write(line.encode('utf-8'))

        # increase line index
        lineCount += 1

    # put everything into a zip file
    zf = zipfile.ZipFile('../web/synthetic_pages/page.zip', 'w')
    for i in range(0, lineCount):
        zf.write('../web/synthetic_pages/' + workDir + str(i) + '.png',    'lines/' + str(i) + '.png')
        zf.write('../web/synthetic_pages/' + workDir + str(i) + '.gt.txt', 'lines/' + str(i) + '.gt.txt')
    zf.close()

    # clean up temporary directory
    shutil.rmtree('../web/synthetic_pages/' + workDir)


def createPages(matches, line_height, text, dimensions, margin, letter_spacing, word_spacing, baseline_skip, db, imageList):
    """ Builds a zip archive containing synthetic pages and lines for the given text """

    # generate random prefix for temporary working directory
    workDir = str(uuid.uuid4()) + '/'
    os.mkdir('../web/synthetic_pages/' + workDir)

    # construct synthetic pages and keep track of the glyphs
    page = Image.new("RGB", (dimensions[0], dimensions[1]), "white")
    pageIndex = 0
    lineIndex = 0
    pageLines = {}
    boxes = []
    cursorY = margin[1]

    # iterate over the lines
    for line in text.split("\n"):
        # skip over empty lines
        if line == "": continue

        # construct line image, store box information
        lineImage, lineBoxes = createLine(line, matches, margin[0], cursorY, line_height, dimensions, word_spacing, letter_spacing)
        boxes += lineBoxes

        # save line image and line text, and copy line into page
        lineImage.save('../web/synthetic_pages/' + workDir + str(pageIndex) + "-" + str(lineIndex) + '.png', "PNG")
        with open('../web/synthetic_pages/' + workDir + str(pageIndex) + "-" + str(lineIndex) + '.gt.txt', 'w') as gt_text_file:
            gt_text_file.write(line.encode('utf-8'))
        page.paste(lineImage, (0, cursorY))

        # move cursor for the next line, increase line index
        cursorY += line_height + baseline_skip
        lineIndex += 1

        # check if we have to start a new page
        if cursorY > dimensions[1] - margin[1]:
            # save current page
            savePage(pageIndex, page, boxes, workDir)
            pageLines[pageIndex] = lineIndex

            # start new page
            pageIndex += 1
            lineIndex = 0
            page = Image.new("RGB", (dimensions[0], dimensions[1]), "white")
            boxes = []
            cursorY = margin[1]

    # save the last page
    savePage(pageIndex, page, boxes, workDir)
    pageLines[pageIndex] = lineIndex

    # put everything into a zip file
    zf = zipfile.ZipFile('../web/synthetic_pages/page.zip', 'w')
    for i in range(0, pageIndex + 1):
        zf.write('../web/synthetic_pages/' + workDir + str(i) + '.tiff', 'tiff_box/page' + str(i) + '.tiff')
        zf.write('../web/synthetic_pages/' + workDir + str(i) + '.box', 'tiff_box/page' + str(i) + '.box')
        for j in range(0, pageLines[i]):
            zf.write('../web/synthetic_pages/' + workDir + str(i) + "-" + str(j) + '.png', 'lines/' + str(i) + '/' + str(j) + '.png')
            zf.write('../web/synthetic_pages/' + workDir + str(i) + "-" + str(j) + '.gt.txt', 'lines/' + str(i) + '/' + str(j) + '.gt.txt')
    zf.close()

    # clean up temporary directory
    shutil.rmtree('../web/synthetic_pages/' + workDir)
