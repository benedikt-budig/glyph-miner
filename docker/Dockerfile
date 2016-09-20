###########################################################
# Dockerfile to build Glyph Miner containers              #
###########################################################

# Set the base image to ubuntu
FROM ubuntu:14.04

MAINTAINER Benedikt Budig "glyphminer@benedikt-budig.de"

ENV DEBIAN_FRONTEND noninteractive

################## BEGIN INSTALLATION #####################
# install required dependencies through apt-get
RUN apt-get update && apt-get install -y \
    g++ \
    git \
    make \
    mysql-server \
    nginx \
    python-dev \
    python-numpy \
    python-mysqldb \
    python-pil \
    python-pip \
 && rm -rf /var/lib/apt/lists/*

# install uswgi through pip
RUN pip install uwsgi

# configure nginx
COPY default /etc/nginx/sites-enabled/default
RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf

# pull the Glyph Miner repository from GitHub
WORKDIR /opt
RUN git clone https://github.com/benedikt-budig/glyph-miner.git
#COPY temp/ /opt/glyph-miner/

# compile the template matching module
WORKDIR /opt/glyph-miner/server
RUN make standalone

# copy the start-up script
COPY start-container.sh /opt/glyph-miner/

################### INSTALLATION END ######################

# expose the default port
EXPOSE 80

# set the default command
CMD ["/opt/glyph-miner/start-container.sh"]

