import React, { useState, useEffect } from 'react';
import { IonSelect, IonSelectOption, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonListHeader, IonItem, IonLabel, IonAvatar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';

const Tab1: React.FC = () => {
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
    "10": "10 짧은표현 200"
  };
  const [groupInfoList, setGroupInfoList] = useState([
        // ... Add more group info as needed
  ]);
  const [selectedGroup, setSelectedGroup] = useState("1"); // Default selected group

  const [contents, setContents] = useState([]);

  const fetchData = async () => {
    const xmlFilePath = '/400Sentences.xml'; // XML 파일 경로를 수정하세요
    
    try {
      const response = await fetch(xmlFilePath);
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const contentNodes = xmlDoc.querySelectorAll('CONTENT');
      const contentArray = Array.from(contentNodes).map((contentNode) => {
        return {
          No: contentNode.getAttribute('No'),
          Type: contentNode.getAttribute('Type'),
          Group: contentNode.getAttribute('Group'),
          FIELD1: contentNode.querySelector('FIELD1').textContent,
          FIELD2: contentNode.querySelector('FIELD2').textContent,
          DESC: contentNode.querySelector('DESC').textContent,
        };
      });
      if (groupInfoList.length == 0) {
        groupInfoList.length = 0;
        let i = 0;
        let curGroup = contentArray[0].Group;
        let grpInfo = { Index: i, Group: curGroup, Count: 0 };
        groupInfoList.push(grpInfo);
        for (i = 0; i < contentArray.length; i++) {
          if (contentArray[i].Group == '') continue;
          grpInfo.Count++;
          if (contentArray[i].Group !== curGroup) {
            grpInfo = { Index: i, Group: contentArray[i].Group, Count: 0 };
            curGroup = grpInfo.Group;
            groupInfoList.push(grpInfo);
          }
        }
      }
      setContents(contentArray);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectChange = (event: CustomEvent) => {
    const selectedValue = event.detail.value;
    setSelectedGroup(selectedValue);
    console.log("Selected Group:", selectedValue);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tab 1</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
        <IonToolbar>
            <IonTitle size="large">Sentence</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonList>
          <IonListHeader> Sentence practice</IonListHeader>
          <IonSelect value={selectedGroup}  interface="popover" onIonChange={handleSelectChange}>
            {groupInfoList.map(group => (
              <IonSelectOption key={group.Group} value={group.Group}>
                {dictGroup[group.Group]}
              </IonSelectOption>
            ))}
          </IonSelect>
          {contents.map((content, index) => (
            content.Group == selectedGroup && (
            <IonItem key={content.No}>
              <IonAvatar slot="start">
                {content.No}
              </IonAvatar>
              <IonLabel>
                <h2 className="ion-text-wrap">{content.FIELD1}</h2>
                <h3 className="ion-text-wrap">{content.FIELD2}</h3>
                <p className="ion-text-wrap">{content.DESC}</p>
              </IonLabel>
            </IonItem>
            )
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
