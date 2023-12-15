import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab3.css';

const Tab3: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large"></IonTitle>

          </IonToolbar>
        </IonHeader>
        <div style={{ textAlign: 'center', margin: '50vh 5vh', transform: 'translateY(-50%)' }}>
        <p>문장연습하는 앱입니다. 중요문장을 통문장으로 지속적으로 암기하시면, 문장만들기, 패턴연습, 회화 ,독해에 다방면으로 도움이 됩니다. </p>
        <p style={{ fontSize: 'small' }}>기본 정보는 지속적으로 무료로 제공될 예정이며 추가기능에 대해 향후 소정의 사용료를 받을 수 있습니다. </p>
      </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
