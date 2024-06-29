import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Storage } from '@ionic/storage';
import { IonModal, IonChip, IonRange, IonBadge, IonGrid, IonRow, IonCol, IonText, IonButtons, IonInput, IonPopover, IonRadio, IonRadioGroup, IonSelect, IonSelectOption, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonListHeader, IonItem, IonLabel, IonAvatar, IonButton, IonIcon, IonProgressBar, IonCard, IonCardTitle, IonCardSubtitle, IonCardHeader, IonCardContent, IonCheckbox} from '@ionic/react';
import { musicalNotes, menuOutline, caretForwardCircleOutline, playOutline, listOutline, arrowForwardOutline, shuffleOutline, } from 'ionicons/icons'; // Import the musicalNotes icon <IonIcon name="caret-forward-circle-outline"></IonIcon>
import { stopCircleOutline, pauseCircleOutline, flash, time } from 'ionicons/icons';
import SentencePractice from '../components/SentencePractice';

const dictGroup = {
      "12": "문법Part1",
      "13": "문법Part2",
      "8": "8 50잉글리시 0~49",
      "9": "9 50잉글리시 50~99",
      "1": "1 문장의5형식",
      "10": "10 짧은표현 200",
      "14": "0. 필수 기본 문장"
    };
 
const Tab0: React.FC = () => {
  
  return <SentencePractice DictGroup={dictGroup} FileName="/180Sentences+.xml" InitGroup='12'/>;
};
export default Tab0;
