import React from 'react';

export const YoutubePlayer = (props: { videoId: string }) => {
    return (
        <iframe
            width="100%"
            height="470"
            style={{ marginTop: '20px', marginBottom: '20px' }}
            src={'https://www.youtube-nocookie.com/embed/' + props.videoId + '?loop=1&modestbranding=1&color=white'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
        ></iframe>
    );
};
