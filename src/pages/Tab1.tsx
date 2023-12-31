import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Storage } from '@ionic/storage';
import {IonModal, IonChip, IonGrid, IonRow, IonCol, IonButtons, IonPopover, IonRadio, IonRadioGroup, IonSelect, IonSelectOption, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonListHeader, IonItem, IonLabel, IonAvatar, IonButton, IonIcon, IonProgressBar, IonCard, IonCardTitle, IonCardSubtitle, IonCardHeader, IonCardContent, IonCheckbox} from '@ionic/react';
import { musicalNotes, menuOutline, caretForwardCircleOutline, playOutline, listOutline, arrowForwardOutline, shuffleOutline, } from 'ionicons/icons'; // Import the musicalNotes icon <IonIcon name="caret-forward-circle-outline"></IonIcon>
import './Tab1.css';
import ReactGA from 'react-ga';

ReactGA.initialize('UA-000000-01');
ReactGA.pageview(window.location.pathname + window.location.search);

type ContentType = {
  No: string | null;
  Type: string | null;
  Group: string | null;
  FIELD1: string | null;
  FIELD2: string | null;
  DESC: string | null;
  EngFile: string | null;
  KorFile: string | null;
};

type GroupInfo = {
  Index: number;
  Group: string | null;
  Count: number;
};

type DictGroup = {
  [key: string]: string;
};

let g_bPlay : boolean = false;

const Tab1: React.FC = () => {
  const buttonStyle = {
    padding: '3px 1px 3px 1px',
    borderRadius: '30%',
  };
  const buttonStyle2 = {
    padding: '3px 1px 3px 1px',
    borderRadius: '30%',
    innerHeight:'30px'
  };
  
  const dictGroup: DictGroup = {
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
  const [groupInfoList, setGroupInfoList] = useState<GroupInfo[]>([
        // ... Add more group info as needed
  ]);
  const { id } = useParams<{ id: string }>();
  const [selectedGroup, setSelectedGroup] = useState(id??"1"); // Default selected group
  const location=useLocation();
  const sch= location.search;
  const params=new URLSearchParams(sch);
  const grpId= params.get('grpId');
  const [progressTxt, setProgressTxt] = useState("");
  const [endedResult, setEndedResult] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);

  const [contents, setContents] = useState<ContentType[]>([]);
  const [currentContent, setCurrentContent] = useState<ContentType>();
  const [currentNo, setCurrentNo] = useState("");
  const [currentField, setCurrentField] = useState("");
  const [currentField0, setCurrentField0] = useState("");
  const [currentDesc, setCurrentDesc] = useState("");
  const [stopButtonName, setStopButtonName] = useState("STOP");

  const [buffer, setBuffer] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [isDescChecked, setIsDescChecked] = useState(true);
  const [selectedDirect, setSelectedDirect] = useState("k2e"); //e2k

  const [showLanguagePopover, setShowLanguagePopover] = useState(false);
  const [showDescriptionPopover, setShowDescriptionPopover] = useState(false);
  const [storage, setStorage] = useState<Storage | null>(null);
  const [record, setRecord] = useState<{ key: string; value: any }[]>([]);

  let bPlay : boolean = false;

  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  const playAudio = (fileName: string | null) => {
    if (audioPlayer) {
      audioPlayer.pause();
    }

    const newAudioPlayer = new Audio(`/audio/${fileName}.mp3`);
    newAudioPlayer.play();
    setAudioPlayer(newAudioPlayer);
    return newAudioPlayer;
  };

  let timeID:number = -1;

    const clearTimer = () => {
    if (timeID > -1) 
      window.clearTimeout(timeID);
    timeID = -1;
    console.log("clearTimer bPlay:" + bPlay);
  }

  function sortByNo(a: ContentType, b: ContentType): number {
    const aNo = a.No || "";
    const bNo = b.No || "";
    // 문자열 비교
    return aNo.localeCompare(bNo);
  }
  function shuffleArray() {
    const newArray = [...contents];
     newArray.sort((a,b) => {
      if (a.Group != b.Group || a.Group != selectedGroup) return 0;
      return Math.random() - 0.5;}
      );
     setContents(newArray);
  }

  function makeOrderList(dir_:string) {
    if (g_bPlay) return;
    if (dir_ == 'random') {
      shuffleArray();
    } else {
      const newArray = [...contents];
      newArray.sort(sortByNo)
      setContents(newArray)
    }
  }

  const playAudioAndWait = (fileName: string | null, waitRate: number) => {
    return new Promise<void>((resolve) => {
      let audio = playAudio(fileName);
      if (audio) {
        audio.onended = function () {
          let waitTime = 2000;
          if (audio.duration && waitRate) {
            waitTime = audio.duration * waitRate * 1000;
          }
          clearTimer();
          timeID =  window.setTimeout(() => {
            resolve();
          }, waitTime);
        };
      }
    });
  };

  const playAudio1Line = async (content : ContentType) => {
    setCurrentContent(content);
    setCurrentField(""); // secondLine
    setCurrentDesc("");
    if (selectedDirect == 'k2e') {
      setCurrentField0(content.FIELD2==null?'':content.FIELD2);
      await playAudioAndWait(content.KorFile, 0.7);
      if (!g_bPlay) return; //isPlaying)
      setCurrentField(content.FIELD1 as string);
      setCurrentDesc(content.DESC as string);
      await playAudioAndWait(content.EngFile, 1);
    } else {
      setCurrentField0(content.FIELD1==null?'':content.FIELD1);
      await playAudioAndWait(content.EngFile, 0.7);
      if (!g_bPlay) return; //isPlaying)
      setCurrentField(content.FIELD2 as string);
      setCurrentDesc(content.DESC as string);
      await playAudioAndWait(content.KorFile, 1);
    }
  };

  function selectGroup(selectedGroup_ : string, bFirst : boolean) {
    setSelectedGroup(selectedGroup_);
    const grpInfo = groupInfoList.find(groupInfo => groupInfo.Group === selectedGroup_);
    const startIndex = grpInfo?.Index as number;
    if (bFirst) 
      setCurrentIndex(startIndex);
    return grpInfo;
    // const count = grpInfo?.Count as number;
  }
  function playOn () {
    setIsPlaying(true);
    g_bPlay = true;
    console.log('playOn bPlay:' + g_bPlay);
  }
  function playOff () {
    setIsPlaying(false);
    g_bPlay = false;
    console.log('playOff bPlay:' + g_bPlay);
  }

  const playStop =() => {
     if (audioPlayer) {
      audioPlayer.pause();
      console.log("playStop audioPlayer.pause()");
    } else {
      console.log("playStop audioPlayer is null");
    }
    clearTimer();
    setProgressTxt(progressTxt=>"");
    playOff();
  }

  let startTime:number;
  function getCurrentTime(): number {
    return new Date().getTime();
  }
  function formatElapsedTime(seconds: number): string {
    let hours: number = Math.floor(seconds / 3600);
    let minutes: number = Math.floor((seconds % 3600) / 60);
    let remainingSeconds: number = seconds % 60;
  
    return `${hours}:${minutes}:${remainingSeconds.toFixed(0)}`;
  }

  function formatedTime(currentTime:Date) {
      return currentTime.getFullYear() + '-' + 
                    ('0' + (currentTime.getMonth() + 1)).slice(-2) + '-' + 
                    ('0' + currentTime.getDate()).slice(-2) + ' ' + 
                    ('0' + currentTime.getHours()).slice(-2) + ':' + 
                    ('0' + currentTime.getMinutes()).slice(-2) + ':' + 
                    ('0' + currentTime.getSeconds()).slice(-2);
  }

  async function playAudio1Group() {
    let started = new Date();
    startTime = getCurrentTime();
    const grpInfo = selectGroup(selectedGroup, false); // groupInfoList.find(groupInfo => groupInfo.Group === selectedGroup);
    const startIndex = grpInfo?.Index as number;
    const count = grpInfo?.Count as number;
    let index = currentIndex;
    const startNo = contents[index].No;
    setProgressTxt(progressTxt=>"Start!");
    playOn();
    setStopButtonName("Stop");

    ReactGA.event({
      category: 'PlayAndStop',
      action: 'start',
      label: `Start ${grpInfo?.Index} ${grpInfo?.Group} ${startNo}`,
    });
    let cnt = 0;
    let endNo = startNo;
    while(index < (startIndex + count)) {
      if (startNo !== contents[index].No) {
        endNo = contents[index].No;
        setProgressTxt(progressTxt=>startNo + " ~ " + contents[index].No);
      }
      setProgress((index - startIndex)/count);
      setBuffer((index - startIndex)/count);
      await playAudio1Line (contents[index]);
      if (!g_bPlay) //isPlaying
        break;
      setCurrentIndex(index=>index+1);
      index++;
      cnt++;
    };
    setProgressTxt(progressTxt=>progressTxt + " Done!");
    setStopButtonName("Close");

    let endTime = getCurrentTime();
    let elapsedTime = endTime - startTime;
    
    let text = `No ${startNo} ~ ${endNo} / Count ${cnt} / Started ${formatedTime(started)} / Elapsed ${formatElapsedTime(elapsedTime/1000)} `;
    await saveData(startTime.toString(), text);
    loadDataAll();
    setEndedResult(endedResult=>text);
    console.log(text);
    ReactGA.event({
      category: 'PlayAndStop',
      action: 'stop',
      label: `End ${grpInfo?.Index} ${grpInfo?.Group} ${endNo}`,
    });
    playOff();
  };

  const fetchData = async () => {
    const xmlFilePath = '/400Sentences.xml'; // XML 파일 경로를 수정하세요
    
    try {
      const response = await fetch(xmlFilePath);
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const contentNodes = xmlDoc.querySelectorAll('CONTENT');
      const contentArray = Array.from(contentNodes)
        .filter((contentNode) => contentNode.getAttribute('Group') !== '')
        .map((contentNode) => {
        const field1 = contentNode.querySelector('FIELD1');
        const field2 = contentNode.querySelector('FIELD2');
        const desc = contentNode.querySelector('DESC');
        return {
          No: contentNode.getAttribute('No'),
          Type: contentNode.getAttribute('Type'),
          Group: contentNode.getAttribute('Group'),
          FIELD1: field1?field1.textContent: '',
          FIELD2: field2?field2.textContent: '',
          EngFile: field1?field1.getAttribute('Name'):'',
          KorFile: field2?field2.getAttribute('Name'):'',
          DESC: desc?desc.textContent: null,
        };
      });
      if (groupInfoList.length == 0) {
        groupInfoList.length = 0;
        let i = 0;
        let curGroup = contentArray[0].Group;
        let grpInfo = { Index: i, Group: curGroup, Count: 0 };
        groupInfoList.push(grpInfo);
        for (i = 0; i < contentArray.length; i++) {
          if (contentArray[i].Group == curGroup) {
            grpInfo.Count++;
          } else { // if (contentArray[i].Group !== curGroup) 
            grpInfo = { Index: i, Group: contentArray[i].Group, Count: 1 }; // start from 1. not 0 for Count;
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
// 데이터 저장 함수
const saveData = async (key: string, value: any): Promise<void> => {
  if (storage)
    await storage.set(key, value);
};

// 데이터 불러오기 함수
const loadData = async (key: string): Promise<any> => {
  if (!storage) return;
  return await storage.get(key);
};

const loadDataAll = async () => {
  if (storage) {
    const keys = await storage.keys();
    const data = await Promise.all(
      keys.map(async key => ({
        key,
        value: await storage.get(key),
      }))
    );
    setRecord(data);
  }
};

  const createStorage = async() => {
    const storage = new Storage();
    await storage.create();
    setStorage(storage);
  }

 useEffect( () => {
    fetchData();
    createStorage();
  }, []);

  const handleSelectChange = (event: CustomEvent) => {
    const selectedValue = event.detail.value;
    selectGroup(selectedValue, true); //
    //

    console.log("Selected Group:", selectedValue);
  };

  const handleLanguageChange= (event: CustomEvent) => {
    const val = event.detail.value;
    setSelectedLanguage(val);
  };

  const handleDescCheckChange= (event: CustomEvent) => {
    setIsDescChecked(event.detail.checked);
  }

  const handleDirectChange= (event: CustomEvent) => {
    const val = event.detail.value;
    setSelectedDirect(val);
  };
  const modal = useRef<HTMLIonModalElement>(null);
  const page = useRef(undefined);

  const [canDismiss, setCanDismiss] = useState(true);
  const [presentingElement, setPresentingElement] = useState<HTMLElement | undefined>(undefined);
  function dismiss() {
    modal.current?.dismiss();

  }
  function didPresent() {
      console.log("didPresent");
      playAudio1Group();
  }
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          
          <table>
            <tr>
            <td>
              {!isPlaying?(
          <IonButton  id="open-modal"><IonIcon icon={playOutline}></IonIcon> <IonIcon icon={listOutline}></IonIcon></IonButton> 
          ):<IonButton onClick={()=>{setCanDismiss(false);playStop()}}>{stopButtonName}</IonButton>}

          <IonModal ref={modal} trigger="open-modal" canDismiss={canDismiss} presentingElement={presentingElement} onDidPresent={didPresent}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>400Sentences <IonChip className="large-chip" outline={true}>{dictGroup[selectedGroup]}</IonChip> </IonTitle>
              <IonButtons slot="end">
              {!isPlaying?<IonButton onClick={() =>{dismiss()}}>Close</IonButton>:""}
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
          <IonCard style={{ minHeight:'16em'}}>
          <IonCardHeader>
            <IonCardTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IonChip outline={true}>{currentContent?.No}</IonChip>
            
             {isPlaying &&(
              <IonButton fill="outline" onClick={() => {playStop();setCanDismiss(true);}}>
                Stop
              </IonButton>
             )}
            </IonCardTitle>
            {isPlaying?(
              <div>
            <IonCardSubtitle className="ion-text-wrap big-size1">{currentField0}</IonCardSubtitle>
            <IonCardSubtitle className="ion-text-wrap big-size1">{currentField}</IonCardSubtitle>
            </div>
            ):
            <IonList>
            {[...record].reverse().map((item, index) => (
              <IonItem key={index}>
                <IonLabel style={{
                  fontSize: index === 0 ? '1.3em' : 'normal',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  fontWeight:  index === 0 ? 'bold':'normal'
                }}>
                  {item.value}
                </IonLabel>
              </IonItem>
            ))}
            </IonList>
          }
          </IonCardHeader>
          <IonCardContent className="ion-text-wrap"></IonCardContent>
        </IonCard>
          </IonContent>
        </IonModal>
            </td>
            <td>
              <IonSelect style={{ fontSize: '1.1em', marginLeft: '0.5em'}} value={selectedGroup}  interface="popover" onIonChange={handleSelectChange}>
              {groupInfoList.map(group => (
                <IonSelectOption key={group.Group} value={group.Group}>
                  {group.Group !== null ? dictGroup[group.Group] : "No Group"}
                </IonSelectOption>
              ))}
            </IonSelect>
            </td>
          
          </tr></table>
          <IonButtons slot="end">
          <IonButton id="click-trigger">
            <IonIcon icon={menuOutline}/>
            </IonButton>
          </IonButtons>
          {isPlaying?(<IonProgressBar buffer={buffer} value={progress} hidden={true}></IonProgressBar>):""}
          {isPlaying?(
          <IonCard style={{ minHeight:'16em'}}>
          <IonCardHeader>
            <IonCardTitle>{currentContent?.No} </IonCardTitle>
            <IonCardSubtitle className="ion-text-wrap">{currentField0}</IonCardSubtitle>
            <IonCardSubtitle className="ion-text-wrap">{currentField}</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent className="ion-text-wrap">{currentDesc}</IonCardContent>
        </IonCard>
):<div>{endedResult}</div>}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
        <IonToolbar>
            <IonTitle size="large">Sentence</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonGrid>
        <IonPopover trigger="click-trigger" triggerAction="click">
            <IonList>
              <IonItem>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <IonList>
                        <IonRadioGroup value={selectedLanguage} onIonChange={handleLanguageChange}>
                          <IonItem>
                            <IonLabel>All</IonLabel>
                            <IonRadio slot="start" value="all" />
                          </IonItem>
                          <IonItem>
                            <IonLabel>Kor</IonLabel>
                            <IonRadio slot="start" value="kor" />
                          </IonItem>
                          <IonItem>
                            <IonLabel>Eng</IonLabel>
                            <IonRadio slot="start" value="eng" />
                          </IonItem>
                        </IonRadioGroup>
                      </IonList>
                    </IonCol>

                    <IonCol size="6">
                      <IonList>
                        <IonItem>
                          <IonLabel>Desc.</IonLabel>
                          <IonCheckbox slot="start" checked={isDescChecked} onIonChange={handleDescCheckChange}></IonCheckbox>
                        </IonItem>
                      </IonList>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonItem>

              <IonItem>
                <IonList>
                  <IonRadioGroup value={selectedDirect} onIonChange={handleDirectChange}>
                    <IonItem>
                      <IonLabel>Korean to English</IonLabel>
                      <IonRadio slot="start" value="k2e" />
                    </IonItem>
                    <IonItem>
                      <IonLabel>English to Korean</IonLabel>
                      <IonRadio slot="start" value="e2k" />
                    </IonItem>
                  </IonRadioGroup>
                </IonList>
              </IonItem>
              <IonItem>
                <IonLabel>Direction </IonLabel>
                <IonButton onClick={() => makeOrderList('forward')}><IonIcon icon={arrowForwardOutline}></IonIcon></IonButton>
                <IonButton onClick={() => makeOrderList('random')}><IonIcon icon={shuffleOutline}></IonIcon></IonButton>
              </IonItem>
            </IonList>
          </IonPopover>
      <IonRow>
    <IonCol>
    <IonList>
          <IonListHeader> <h1>Sentence practice</h1></IonListHeader>
          <p style={{marginLeft:'0.5em'}}>{dictGroup[selectedGroup]}</p>
          {contents.map((content, index) => (
            content.Group == selectedGroup && (
            <IonItem key={content.No}>
              <IonAvatar slot="start" className="avatarStyle">
                <table><tr><td><IonChip outline={true}>{content.No}</IonChip></td></tr><tr><td><IonButton onClick={async () => {setCurrentIndex(index);playOn();await playAudio1Line(content);playOff();}}><IonIcon icon={caretForwardCircleOutline}/></IonButton></td></tr></table>
              </IonAvatar>
              <IonLabel className={currentIndex == index?'highlight':''}>
              {selectedLanguage != 'eng'?(
                <h2 className="ion-text-wrap" style={{fontStyle:'Nanum Myeongjo'}}><IonButton style={buttonStyle} onClick={() => playAudio(content.KorFile)}> 
                <IonIcon icon={caretForwardCircleOutline}></IonIcon></IonButton>
                 {content.FIELD2}</h2>
              ):''}
              {selectedLanguage != 'kor'?(
                <h2 className="ion-text-wrap"><IonButton style={buttonStyle} onClick={() => playAudio(content.EngFile)}> 
                <IonIcon icon={caretForwardCircleOutline}></IonIcon></IonButton> 
                {content.FIELD1}</h2>
              ):''}
              {isDescChecked?(
                <p className="ion-text-wrap">{content.DESC}</p>
                ):''}
              </IonLabel>
            </IonItem>
            )
          ))}
        </IonList>
    </IonCol>
  </IonRow>
</IonGrid>
        
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
