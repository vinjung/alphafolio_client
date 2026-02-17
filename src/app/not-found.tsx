import Link from 'next/link';
import { Button } from '@/components/shared/button';
import { Text } from '@/components/shared/text';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="text-[100px] mb-6">🤷‍♂️</div>

      <Text variant="t1" className="text-neutral-900 mb-14">
        페이지를 찾을 수 없어요… <br />
        주소를 다시 확인해 주세요.
      </Text>

      <Link href="/" className="w-full max-w-xs">
        <Button variant="gradient" fullWidth>
          홈으로 돌아가기
        </Button>
      </Link>
    </div>
  );
}
