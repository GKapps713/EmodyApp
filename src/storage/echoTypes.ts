// src/storage/echoTypes.ts
// Echo: 공통 데이터
export type Echo = {
  id: string;
  userId: string;         
  title: string;
  duration: number;       
  prompt: string;         
  audioUrl: string;       
  createdAt: string;      

  // 상태/속성
  isPublic: boolean;      
  echoScore: number;      
  playCount: number;      
  purchaseCount: number;  
  genre: string;          

  // 유료/만료 관련
  expiresAt?: string;     
  isPurchased: boolean;   
  cost: number;           

  // 파일 메타데이터
  fileSize?: number;      

  // ✅ 썸네일
  thumbnail?: string;
  
  // 좋아요 (총 카운트)
  likes: number;  

  // 추세용 히스토리
  likesHistory?: { date: string; count: number }[];

  // 부스팅
  boostedUntil?: string; 

  // 세부 태그
  emotion?: string;  
  mood?: string;     
  rhythm?: string;   
  style?: string;    
  sounds?: string[]; 
  extra?: string;    
};

// 사용자별 좋아요 기록
export type UserLike = {
  echoId: string;
  userId: string;
  liked: boolean;
};
