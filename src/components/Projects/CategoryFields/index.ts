// Category Fields Components
// This module provides dynamic, category-aware fields for project showcasing

// Field Renderers
export {
  renderFieldByType,
  DisplayFieldValue,
  FieldWrapper,
  validateCategoryData,
  validateFieldValue,
  checkForProfanity,
  checkArrayForProfanity,
  type FieldRendererProps,
  type DisplayFieldProps,
  type FieldWrapperProps,
  type ValidationResult,
} from "./FieldRenderers";

// Empty State
export {
  EmptyFieldsState,
  AddMoreFieldsPrompt,
  type EmptyFieldsStateProps,
  type AddMoreFieldsPromptProps,
} from "./EmptyFieldsState";

// Field Selector
export {
  FieldSelector,
  FieldToggleChips,
  type FieldSelectorProps,
  type FieldToggleChipsProps,
} from "./FieldSelector";

// Completeness Score
export {
  CompletenessScore,
  CompletenessScoreCard,
  calculateCompletenessScore,
  type CompletenessScoreProps,
  type CompletenessScoreCardProps,
} from "./CompletenessScore";

// Category Fields Editor (Edit Mode)
export {
  CategoryFieldsEditor,
  type CategoryFieldsEditorProps,
} from "./CategoryFieldsEditor";

// Category Change Modal
export {
  CategoryChangeConfirmationModal,
  useCategoryChange,
  type CategoryChangeConfirmationModalProps,
  type UseCategoryChangeOptions,
} from "./CategoryChangeConfirmationModal";

// Category Fields Display (View Mode)
export {
  CategoryFieldsDisplay,
  TechStackHighlight,
  FeaturesList,
  ChallengesSection,
  type CategoryFieldsDisplayProps,
  type TechStackHighlightProps,
  type FeaturesListProps,
  type ChallengesSectionProps,
} from "./CategoryFieldsDisplay";
