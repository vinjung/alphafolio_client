import React, { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Text } from '@/components/shared/text';
import type { Components } from 'react-markdown';
import { useAppStore } from '@/stores';

// 포맷된 텍스트를 렌더링하는 컴포넌트
interface FormattedTextProps {
  children: string;
  className?: string;
}

// ✅ 추천 질문 링크 컴포넌트
const QuestionLink = ({ question }: { question: string }) => {
  const sendRecommendedQuestion = useAppStore(
    (state) => state.sendRecommendedQuestion
  );

  const handleClick = () => {
    if (sendRecommendedQuestion) {
      sendRecommendedQuestion(question);
    }
  };

  return (
    <span
      onClick={handleClick}
      className="text-blue-600 hover:text-blue-700 cursor-pointer hover:underline underline"
    >
      {question}
    </span>
  );
};

// ✅ [[질문:...]] 형식을 파란색 링크로 변환하는 함수
function processQuestionLinks(text: string): ReactNode[] {
  const parts = text.split(/(\[\[질문:[^\]]+\]\])/g);

  return parts.map((part, index) => {
    const match = part.match(/\[\[질문:([^\]]+)\]\]/);
    if (match) {
      return <QuestionLink key={index} question={match[1]} />;
    }
    return part;
  });
}

/**
 * react-markdown 커스텀 컴포넌트 설정
 */
const markdownComponents: Components = {
  // 문단 스타일링
  p: ({ children }: { children?: ReactNode }) => (
    <div className="mb-4 last:mb-0">{children}</div>
  ),

  // 강조 텍스트 (볼드)
  strong: ({ children }: { children?: ReactNode }) => (
    <Text as="strong" variant="s2" className="font-bold">
      {children}
    </Text>
  ),

  // 헤딩을 강조 텍스트처럼 처리
  h1: ({ children }: { children?: ReactNode }) => (
    <Text as="strong" variant="s2" className="font-bold">
      {children}
    </Text>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <Text as="strong" variant="s2" className="font-bold">
      {children}
    </Text>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <Text as="strong" variant="s2" className="font-bold">
      {children}
    </Text>
  ),
  h4: ({ children }: { children?: ReactNode }) => (
    <Text as="strong" variant="s2" className="font-bold">
      {children}
    </Text>
  ),
  h5: ({ children }: { children?: ReactNode }) => (
    <Text as="strong" variant="s2" className="font-bold">
      {children}
    </Text>
  ),
  h6: ({ children }: { children?: ReactNode }) => (
    <Text as="strong" variant="s2" className="font-bold">
      {children}
    </Text>
  ),

  // 순서 없는 리스트 (ul)
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="space-y-1 mb-4 ml-4" style={{ listStyleType: 'disc' }}>
      {children}
    </ul>
  ),

  // 순서 있는 리스트 (ol)
  ol: ({ children, start }: { children?: ReactNode; start?: number }) => (
    <ol className="space-y-1 mb-4 ml-4" style={{ listStyleType: 'decimal' }} start={start}>
      {children}
    </ol>
  ),

  // 리스트 아이템 - [[질문:...]] 처리
  li: ({ children }: { children?: ReactNode }) => {
    if (typeof children === 'string') {
      return <li>{processQuestionLinks(children)}</li>;
    }
    return <li>{children}</li>;
  },

  // 구분선
  hr: () => <hr className="my-4 border-neutral-300" />,

  // 코드 블록 (인라인)
  code: ({ children }: { children?: ReactNode }) => (
    <code className="bg-neutral-100 px-1 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),

  // 링크
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      className="text-red-600 underline hover:text-red-700"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

export function FormattedText({ children, className }: FormattedTextProps) {
  return (
    <Text as="div" variant="b2" className={`formatted-response ${className ?? ''}`}>
      <ReactMarkdown components={markdownComponents}>{children}</ReactMarkdown>
    </Text>
  );
}
