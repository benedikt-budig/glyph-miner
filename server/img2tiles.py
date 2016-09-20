#!/usr/bin/env python

import os
import sys
import math
from PIL import Image

def create_tiles(image_path, base_path, verbose):
  # parameters
  tile_size = (256, 256)
  verbose = int(verbose)

  # read image file and get dimensions
  im = Image.open(image_path).convert("RGBA")
  (image_width, image_height) = im.size

  tile_width, tile_height = tile_size
  cols = int(math.ceil(float(image_width)/float(tile_width)))
  rows = int(math.ceil(float(image_height)/float(tile_height)))
  max_zoom = int(max(math.ceil(math.log(cols, 2)), math.ceil(math.log(rows, 2))))
  
  if verbose:
    sys.stdout.write("Got image of size %i x %i, creating %i x %i tiles of size %i x %i.\n" % (image_width, image_height, cols, rows, tile_width, tile_height))

  if verbose:
    sys.stdout.write("Creating basic tiles...\n")
  for x in range(0, cols):
    for y in range(0, rows):
      left = x * tile_width
      right = left + tile_width
      upper = y * tile_height
      lower = upper + tile_height
      filename = base_path + '/' + str(max_zoom) + '/' + str(x) + "/" + str(y) + ".png"
      if not os.path.exists(os.path.dirname(filename)):
        os.makedirs(os.path.dirname(filename))
      im.crop((left, upper, right, lower)).save(filename)
      if verbose:
        sys.stdout.write("\r%i / %i" % (x * rows + y + 1, rows * cols))
        sys.stdout.flush()
  if verbose:
    sys.stdout.write("\n")
  del im

  if verbose:
    sys.stdout.write("Creating overview tiles...\n")
  for z in range(max_zoom - 1, -1, -1):
    cols = int(math.ceil(cols / 2.0))
    rows = int(math.ceil(rows / 2.0))
    for x in range(0, cols):
      for y in range(0, rows):
        filename = base_path + '/' + str(z) + '/' + str(x) + "/" + str(y) + ".png"
        if not os.path.exists(os.path.dirname(filename)):
          os.makedirs(os.path.dirname(filename))
        
        # get (up to) four tiles from previous zoom layer to compose new tile
        tile = Image.new("RGBA", tile_size) 
        
        try:
          partim = Image.open(base_path + '/' + str(z + 1) + '/' + str(x * 2) + '/' + str(y * 2) + ".png")
          tile.paste(partim.resize((tile_width / 2, tile_height / 2), Image.ANTIALIAS), (0,0))
        except:
          pass
        try:
          partim = Image.open(base_path + '/' + str(z + 1) + '/' + str(x * 2 + 1) + '/' + str(y * 2) + ".png")
          tile.paste(partim.resize((tile_width / 2, tile_height / 2), Image.ANTIALIAS), (tile_width / 2,0))
        except:
          pass
        try:
          partim = Image.open(base_path + '/' + str(z + 1) + '/' + str(x * 2) + '/' + str(y * 2 + 1) + ".png")
          tile.paste(partim.resize((tile_width / 2, tile_height / 2), Image.ANTIALIAS), (0, tile_height / 2))
        except:
          pass     
        try:
          partim = Image.open(base_path + '/' + str(z + 1) + '/' + str(x * 2 + 1) + '/' + str(y * 2 + 1) + ".png")
          tile.paste(partim.resize((tile_width / 2, tile_height / 2), Image.ANTIALIAS), (tile_width / 2, tile_height / 2))
        except:
          pass
                  
        tile.save(filename)
        if verbose:
          sys.stdout.write("\r%i / %i" % (x * rows + y + 1, rows * cols))
          sys.stdout.flush()
    if verbose:
      sys.stdout.write("\n")  
  if verbose:
    sys.stdout.write("\n")

if __name__ == "__main__":
  create_tiles(sys.argv[1], sys.argv[2], sys.argv[3])

