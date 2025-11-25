// Highlight component to highlight matched text
export function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) {
    return <>{text}</>;
  }
  
  const searchLower = highlight.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Find substring match anywhere in the text
  const matchIndex = textLower.indexOf(searchLower);
  
  if (matchIndex === -1) {
    return <>{text}</>;
  }
  
  const beforeMatch = text.substring(0, matchIndex);
  const match = text.substring(matchIndex, matchIndex + searchLower.length);
  const afterMatch = text.substring(matchIndex + searchLower.length);
  
  return <span>{beforeMatch}<span className="bg-primary/20 text-primary font-semibold">{match}</span>{afterMatch}</span>;
}
