#include <iostream>
#include <fstream>
#include <bitset>
#include <string>
#include <vector>
#include <ctime>
#include <cmath>
#include <algorithm>
#include <sstream>
using namespace std;

#include <omp.h>

#include "lodepng.h"

#ifndef _MSC_VER
#define strcpy_s(a,b,c) strcpy(a,c)
#endif

struct Match {
	unsigned int x, y;
	double score;
	unsigned int rank;
	Match( unsigned int x, unsigned int y, double score ) : x(x), y(y), score(score) {}
};

template< int wordsize >
string getMatches( const vector<unsigned char> &image_in, unsigned int imageW, unsigned int imageH,
                  const vector<unsigned char> &needle_in, unsigned int needleW, unsigned int needleH,
                  int maxMatches ) {
                  
	//const size_t wordsize = 128;
	cerr << "Running with wordsize " << wordsize << endl;
	typedef bitset<wordsize> word;

	std::vector<double> score( imageW*imageH, 0.0 );                  
                  
	cerr << "Needle: " << needleW << " x " << needleH << endl;
	if( needleW>wordsize ) {
		cerr << "Needle too wide for word (" << wordsize << ")." << endl;
		return 0;
	}
	double perPixel = 1.0 / (needleW*needleH);
	vector<word> needle;
	needle.reserve( needleH );
	for( size_t y=0; y<needleH; ++y ) {
		word temp;
		for( size_t x=0; x<needleW; ++x ) {
			temp.set( needleW-x-1, needle_in[ 4*(y*needleW + x) ]>127 );
		}
		needle.push_back( temp );
	}    
                  
	cerr << "Start matching. " << endl;
	clock_t cpuStart = clock();
	double wallStart = omp_get_wtime();

	#pragma omp parallel for
	for( int y=0; y<imageH-needleH; ++y ) {

		vector<word> window;
		window.resize( needle.size() );	
		for( size_t yi=0; yi<needleH; ++yi ) {
			window[yi].reset();
			for( size_t xi=0; xi<needleW; ++xi ) {
				window[yi].set( needleW-xi-1, image_in[4*((y+yi)*imageW+xi)]>127 );
			}
		}

		for( size_t x=needleW; x<imageW; ++x ) {
			double windowOffset = 0;
			size_t nDiff = 0;
			for( size_t yi=0; yi<needleH; ++yi ) {
				word w = window[yi];
				nDiff += ( w ^ needle[yi] ).count();
				w <<= 1;
				w.set( 0, image_in[4*((y+yi)*imageW+x)]>127 );
				w.reset( needleW );
				window[yi] = w;
			}
			score[ y*imageW + x ] += nDiff;		

		}
	}
		
	vector<Match> matches;
		
	unsigned long localmincount = 0;
	for( size_t y=1; y<imageH-needleH-1; ++y ) {
		for( size_t x=needleW+1; x<imageW-1; ++x ) {
			double here = score[ (imageW*y + x) ];
			if( score[ (imageW*(y-1) + (x-1)) ] <= here ) continue;
			if( score[ (imageW*(y-1) + (x  )) ] <= here ) continue;
			if( score[ (imageW*(y-1) + (x+1)) ] <= here ) continue;
			if( score[ (imageW*(y  ) + (x-1)) ] <= here ) continue;
			if( score[ (imageW*(y  ) + (x+1)) ] <= here ) continue;
			if( score[ (imageW*(y+1) + (x-1)) ] <= here ) continue;
			if( score[ (imageW*(y+1) + (x  )) ] <= here ) continue;
			if( score[ (imageW*(y+1) + (x+1)) ] <= here ) continue;
			
			matches.push_back( Match(x-needleW,y,here) );
			
			++localmincount;
		}
	}
	
	sort( matches.begin(), matches.end(), []( Match a, Match b ) { return a.score<b.score; } );
	ostringstream resultJson;
	resultJson << "[";
	int rank = 0;
	for( Match &m : matches ) {
		if( rank>=maxMatches ) break;
		m.rank = rank++;
		if( rank>1 ) resultJson << ",";
		resultJson << "\n";
		resultJson << "{";
		resultJson << "\"rank\": " << m.rank << ", ";
		resultJson << "\"x\": " << m.x << ", ";
		resultJson << "\"y\": " << m.y << ", ";
		resultJson << "\"h\": " << needleH << ", ";
		resultJson << "\"w\": " << needleW << ", ";
		resultJson << "\"score\": " << 1.0 - (m.score/(needleW*needleH));
		resultJson << "}";
	}

	resultJson << "\n]" << endl;

	cerr << "Done, found " << localmincount << "." << endl;
	cerr << "    CPU time = " << (double(clock()-cpuStart)/double(CLOCKS_PER_SEC)) << endl;
	cerr << "   Wall time = " << (omp_get_wtime()-wallStart) << endl;
	
	return resultJson.str();
}

string getMatchesDispatch( const vector<unsigned char> &image_in, unsigned int imageW, unsigned int imageH,
                  const vector<unsigned char> &needle_in, unsigned int needleW, unsigned int needleH,
                  int maxMatches ) {

	if( needleW <= 32 ) return getMatches<32>( image_in, imageW, imageH, needle_in, needleW, needleH, maxMatches );
	if( needleW <= 64 ) return getMatches<64>( image_in, imageW, imageH, needle_in, needleW, needleH, maxMatches );
	if( needleW <= 96 ) return getMatches<96>( image_in, imageW, imageH, needle_in, needleW, needleH, maxMatches );
	if( needleW <= 128 ) return getMatches<128>( image_in, imageW, imageH, needle_in, needleW, needleH, maxMatches );
	if( needleW <= 192 ) return getMatches<196>( image_in, imageW, imageH, needle_in, needleW, needleH, maxMatches );
	if( needleW <= 256 ) return getMatches<256>( image_in, imageW, imageH, needle_in, needleW, needleH, maxMatches );
	if( needleW <= 512 ) return getMatches<512>( image_in, imageW, imageH, needle_in, needleW, needleH, maxMatches );
	return "{[\"error\": \"template wider than 512 pixels not supported\"]}";
}

string matchesFromImageNeedle( const char *imageFname, const char *needleFname, int maxMatches ) {	

	std::vector<unsigned char> image_in;
	unsigned int imageW, imageH;
	cerr << "Loading image from '" << imageFname << "'" << endl;
	unsigned int error = lodepng::decode( image_in, imageW, imageH, imageFname );
	if( error ) {
		cerr << "Error loading image:" << lodepng_error_text(error) << endl;
		return 0;
	}
	cerr << "Image: " << imageW << " x " << imageH << endl;

	std::vector<unsigned char> needle_in;
	unsigned int needleW, needleH;
	cerr << "Loading needle from '" << needleFname << "'" << endl;
	error = lodepng::decode( needle_in, needleW, needleH, needleFname );
	if( error ) {
		cerr << "Error loading needle: " << lodepng_error_text(error) << endl;
		return 0;
	}
	
	cerr << "Loaded images." << endl;
	
	return getMatchesDispatch( image_in, imageW, imageH,
	                           needle_in, needleW, needleH,
	                           maxMatches );
		
}

string matchesFromImageCoords( const char *imageFname, int offsetX, int offsetY, int needleW, int needleH, int maxMatches ) {
	std::vector<unsigned char> image_in;
	unsigned int imageW, imageH;
	cerr << "Loading image from '" << imageFname << "'" << endl;
	unsigned int error = lodepng::decode( image_in, imageW, imageH, imageFname );
	if( error ) {
		cerr << "Error loading image:" << lodepng_error_text(error) << endl;
		return 0;
	}
	cerr << "Image: " << imageW << " x " << imageH << endl;
	
	vector<unsigned char> needle_in;
	needle_in.resize( needleW * needleH * 4 );
	for( int y=0; y<needleH; ++y ) {
		for( int x=0; x<needleW; ++x ) {
			needle_in[ 4*(needleW*y + x)+0 ] = image_in[ 4*(  imageW*(offsetY+y) + offsetX+x )+0 ];
			needle_in[ 4*(needleW*y + x)+1 ] = image_in[ 4*(  imageW*(offsetY+y) + offsetX+x )+1 ];
			needle_in[ 4*(needleW*y + x)+2 ] = image_in[ 4*(  imageW*(offsetY+y) + offsetX+x )+2 ];
			needle_in[ 4*(needleW*y + x)+3 ] = image_in[ 4*(  imageW*(offsetY+y) + offsetX+x )+3 ];
		}
	}
	cerr << "Needle: " << needleW << " x " << needleH << " ==> " << needle_in.size() << endl;
	
	cerr << "Loaded images." << endl;
	
	return getMatchesDispatch( image_in, imageW, imageH,
	                           needle_in, needleW, needleH,
	                           maxMatches );
	
}

int main( int argc, const char* argv[] ) {
    if (argc == 7) {
        const char *fName = argv[1];
        int offsetX = atoi(argv[2]);
        int offsetY = atoi(argv[3]);
        int needleW = atoi(argv[4]); 
        int needleH = atoi(argv[5]); 
        int maxMatches = atoi(argv[6]);
        cout << matchesFromImageCoords( fName, offsetX, offsetY, needleW, needleH, maxMatches ) << endl;
    } else if (argc == 4) {
        const char *fName = argv[1];
        const char *tName = argv[2];
        int maxMatches = atoi(argv[3]);
        cout << matchesFromImageNeedle( fName, tName, maxMatches ) << endl;    
    } else {
      cerr << "Usage 1: match imageFname offsetX offsetY needleW needleH maxMatches" << endl;
      cerr << "Usage 2: match imageFname templateFname maxMatches" << endl;
      return 1;    
    }
}

