import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Storage } from '@ionic/storage';
import { IonModal, IonChip, IonRange, IonBadge, IonGrid, IonRow, IonCol, IonText, IonButtons, IonInput, IonPopover, IonRadio, IonRadioGroup, IonSelect, IonSelectOption, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonListHeader, IonItem, IonLabel, IonAvatar, IonButton, IonIcon, IonProgressBar, IonCard, IonCardTitle, IonCardSubtitle, IonCardHeader, IonCardContent, IonCheckbox} from '@ionic/react';
import { musicalNotes, menuOutline, caretForwardCircleOutline, playOutline, listOutline, arrowForwardOutline, shuffleOutline, } from 'ionicons/icons'; // Import the musicalNotes icon <IonIcon name="caret-forward-circle-outline"></IonIcon>
import { stopCircleOutline, pauseCircleOutline, flash, time } from 'ionicons/icons';
import SentencePractice from '../components/SentencePractice';

const dictGroup = {
    "1": "1 문장의5형식",
    "2": "2 명사,대명사,관사 등",
    "3": "3 형용사,부사",
    "4": "4 부사/동사/조동사/시제/진행형",
    "5": "5 구/절/부정사",
    "6": "6 동명사,분사,비교,완료,수동태,관계대명사,관계부사",
    "7": "7 접속사/가정법, 기타",
    "8": "8 50잉글리시 0~49",
    "9": "9 50잉글리시 50~99",
    "10": "10 짧은표현 200",
    "11": "11 응용문장 300"
  };

const Tab1: React.FC = () => {
  
  return <SentencePractice DictGroup={dictGroup} FileName="/400Sentences.xml" InitGroup='1'/>;
};
export default Tab1;