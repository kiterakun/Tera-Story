import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryContent } from '../../components/StoryContent';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    entityTypes: {
      character: 'Nhân vật',
      item: 'Vật phẩm',
      specialItem: 'Vật phẩm đặc biệt',
    },
  }),
}));

describe('StoryContent typography', () => {
  describe('Typography contract', () => {
    it('uses font-serif for body text', () => {
      const { container } = render(<StoryContent text="Hello world." />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('font-serif');
    });

    it('applies the prose text size (17px)', () => {
      const { container } = render(<StoryContent text="Hello world." />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('text-[1.0625rem]');
    });

    it('applies the prose line height (1.7)', () => {
      const { container } = render(<StoryContent text="Hello world." />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('leading-[1.7]');
    });

    it('applies theme-aware text color (text-ink-100)', () => {
      const { container } = render(<StoryContent text="Hello world." />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('text-ink-100');
    });
  });

  describe('Heading hierarchy (prose)', () => {
    it('styles h1 with font-display + gold', () => {
      const { container } = render(<StoryContent text="<h1>Title</h1>" />);
      // dangerouslySetInnerHTML? actually it parses paragraph by paragraph.
      // The class is on the wrapper. Verify it's there.
      const root = container.firstChild as HTMLElement;
      expect(root.className).toMatch(/\[&_h1\]:font-display/);
      expect(root.className).toMatch(/\[&_h1\]:text-gold-500/);
    });
  });

  describe('Drop-cap', () => {
    it('applies first-paragraph class only to the first paragraph (when >1 paragraphs)', () => {
      const { container } = render(
        <StoryContent text={'First paragraph.\n\nSecond paragraph.'} />,
      );
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0]).toHaveClass('first-paragraph');
      expect(paragraphs[1]).not.toHaveClass('first-paragraph');
    });

    it('does not apply first-paragraph when only one paragraph (avoids drop-cap on short text)', () => {
      const { container } = render(<StoryContent text="Just one paragraph." />);
      const paragraph = container.querySelector('p');
      expect(paragraph).not.toHaveClass('first-paragraph');
    });
  });

  describe('Pull-quote', () => {
    it('renders paragraph starting with > as blockquote', () => {
      const { container } = render(<StoryContent text={'> A memorable quote.'} />);
      const quote = container.querySelector('blockquote');
      expect(quote).toBeInTheDocument();
      expect(quote).toHaveClass('border-l-4');
      expect(quote).toHaveClass('border-gold-400');
      expect(quote).toHaveClass('font-display');
      expect(quote).toHaveClass('italic');
      expect(quote?.textContent).toBe('A memorable quote.');
    });

    it('renders regular paragraph as <p> (not blockquote)', () => {
      const { container } = render(<StoryContent text="Just regular text." />);
      expect(container.querySelector('blockquote')).toBeNull();
      expect(container.querySelector('p')).toBeInTheDocument();
    });
  });

  describe('Entity markup (rarity-aware colors)', () => {
    it('character markup uses accent color', () => {
      const { container } = render(
        <StoryContent text={'[[char:Alice]] went home.'} />,
      );
      const btn = container.querySelector('button');
      expect(btn).toHaveClass('text-accent-400');
    });

    it('legendary item markup uses gold color', () => {
      const { container } = render(
        <StoryContent text={'[[item:Excalibur:legendary]] gleamed.'} />,
      );
      const btn = container.querySelector('button');
      expect(btn).toHaveClass('text-amber-400');
    });

    it('rare item markup uses blue color', () => {
      const { container } = render(
        <StoryContent text={'[[item:Ring of Power:rare]] glowed.'} />,
      );
      const btn = container.querySelector('button');
      expect(btn).toHaveClass('text-blue-400');
    });

    it('common item markup uses gray color', () => {
      const { container } = render(
        <StoryContent text={'[[item:Rock:common]] fell.'} />,
      );
      const btn = container.querySelector('button');
      expect(btn).toHaveClass('text-gray-300');
    });

    it('special item with default rarity uses common fallback', () => {
      const { container } = render(
        <StoryContent text={'[[special:Shadow Cloak]] whispered.'} />,
      );
      const btn = container.querySelector('button');
      expect(btn).toHaveClass('text-gray-300'); // common fallback
    });

    it('calls onEntityClick when entity button is clicked', () => {
      const onClick = vi.fn();
      render(
        <StoryContent
          text={'[[item:Amulet:epic]] glowed.'}
          onEntityClick={onClick}
        />,
      );
      const btn = screen.getByRole('button', { name: /Amulet/i });
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledOnce();
      expect(onClick).toHaveBeenCalledWith({
        type: 'item',
        name: 'Amulet',
        rarity: 'epic',
      });
    });

    it('entity button has aria-label for screen readers', () => {
      render(<StoryContent text={'[[item:Amulet:epic]] glowed.'} />);
      const btn = screen.getByRole('button', { name: /Vật phẩm.*Amulet/i });
      expect(btn).toBeInTheDocument();
    });

    it('entity button has focus-visible ring for keyboard a11y', () => {
      render(<StoryContent text={'[[item:Amulet:epic]] glowed.'} />);
      const btn = screen.getByRole('button', { name: /Amulet/i });
      expect(btn.className).toMatch(/focus-visible:ring/);
    });
  });

  describe('Paragraph splitting', () => {
    it('splits on double newline', () => {
      const { container } = render(
        <StoryContent text={'Para 1.\n\nPara 2.\n\nPara 3.'} />,
      );
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBe(3);
    });

    it('renders plain text as plain span inside paragraph', () => {
      const { container } = render(<StoryContent text="Plain text." />);
      const span = container.querySelector('p span');
      expect(span?.textContent).toBe('Plain text.');
    });
  });
});
