import React from 'react';
import { View, Text, StyleSheet, Image, Button } from 'react-native';
import Video, { useVideoPlayer, VideoView } from 'expo-video';
import { GameQuestion } from '../types/GameData';
import { useEvent } from 'expo';

export interface AnswerCardProps {
  question: GameQuestion;
  answer: string | null;
  partnerInterviewedName: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
}

function getAnswerDisplay(question: GameQuestion, answer: string | null): string {
  if (!answer) return 'No answer';
  if (question.question_type === 'true_false') {
    return answer === 'true' ? 'True' : 'False';
  }
  if (question.question_type === 'multiple_choice' && question.allow_multiple_selection) {
    try {
      const arr = JSON.parse(answer);
      if (Array.isArray(arr)) return arr.join(', ');
    } catch { }
  }
  return answer;
}

export const VideoScreen = ({ mediaUrl }: { mediaUrl: string }) => {
  const player = useVideoPlayer(mediaUrl, player => {
    player.loop = true;
    player.play();
  });
  const { isPlaying } = useEvent(player, 'playingChange', {isPlaying: player.playing});
  
  return (
    <View style={styles.videoContainer}>
      <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />
      <View style={styles.controlsContainerVideo}>
        <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            if (isPlaying) {
              player.pause();
            } else {
              player.play();
            }
          }}
        />
      </View>
    </View>
  );
}

export function AnswerCard({ 
  question, 
  answer, 
  partnerInterviewedName, 
  mediaUrl, 
  mediaType 
}: AnswerCardProps) {
  return (
    <View style={styles.answerCardContainer}>
      <Text style={styles.partnersNameText}>{`${partnerInterviewedName}'s answer`}</Text>
      <View style={styles.bubbleWrapper}>
        <View style={styles.bubbleTail} />
        <View>
          <Text style={styles.answerLabel}>{getAnswerDisplay(question, answer)}</Text>
          
          {/* Media Display */}
          {mediaUrl && mediaType && (
            <View style={styles.mediaContainer}>
              {mediaType === 'image' ? (
                <Image 
                  source={{ uri: mediaUrl }} 
                  style={styles.mediaImage}
                  resizeMode="contain"
                />
              ) : mediaType === 'video' ? (
                <VideoScreen mediaUrl={mediaUrl} />
              ) : null}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  partnersNameText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  answerCardContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleTransparent: {
    maxWidth: '80%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginLeft: 6,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderTopColor: 'transparent',
    borderRightWidth: 16,
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderStyle: 'solid',
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
    textAlign: 'left',
    marginBottom: 8,
  },
  mediaContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mediaImage: {
    width: 350,
    height: 275,
    borderRadius: 12,
  },
  mediaVideo: {
    width: 350,
    height: 275,
    borderRadius: 12,
  },
  videoContainer: {
    width: '100%',
    // paddingLeft: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: 350,
    height: 275,
    borderRadius: 12,
  },
  controlsContainerVideo: {
    padding: 10,
    // paddingLeft: 20,
    alignItems: 'center',
  },
}); 