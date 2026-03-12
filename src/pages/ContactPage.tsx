import { type ChangeEvent, type FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { PageIntroBlock, PageSectionBlock, PageVisualBlock, PublicPageTemplate } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { submitInquiry } from '../lib/api';
import { useSiteContent } from '../context/SiteContentContext';
import { resolveIcon } from '../lib/icons';
import { fadeUp } from '../lib/motion';

const initialForm = {
  organizationName: '',
  contactName: '',
  email: '',
  eventDate: '',
  message: '',
};

export function ContactPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.contact;
  const content = siteContent.contact;
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');

    try {
      await submitInquiry(form);
      setForm(initialForm);
      setSubmitMessage(content.submitSuccessMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : '문의 저장 중 오류가 발생했습니다.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const blocks = {
    intro: <PageIntroBlock eyebrow={content.introEyebrow} title={copy.introTitle} description={copy.introDescription} />,
    visual: <PageVisualBlock imageUrl={content.heroImageUrl} alt="문의 페이지 대표 이미지" />,
    options: (
      <PageSectionBlock
        id="contact-options"
        eyebrow={content.optionsEyebrow}
        title={copy.optionsTitle}
        description={copy.optionsDescription}
      >
        <div className="contact-grid">
          {content.options.map(({ title, description, iconKey }) => {
            const Icon = resolveIcon(iconKey);
            return (
              <motion.article key={title} {...fadeUp} className="contact-card">
                <div className="value-card__icon">
                  <Icon size={24} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </motion.article>
            );
          })}
          <motion.article {...fadeUp} className="contact-card contact-card--trust">
            <div className="value-card__icon">
              <ShieldCheck size={24} />
            </div>
            <h3>{copy.trustCardTitle}</h3>
            <p>{copy.trustCardDescription}</p>
            <ul className="contact-card__list">
              {content.trustBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.article>
        </div>
      </PageSectionBlock>
    ),
    form: (
      <PageSectionBlock
        id="contact-form"
        variant="alt"
        eyebrow={content.formEyebrow}
        title={copy.formTitle}
        description={copy.formDescription}
      >
        <div className="contact-form-layout">
          <motion.form {...fadeUp} className="contact-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-field">
                <span>{content.organizationLabel}</span>
                <input
                  name="organizationName"
                  type="text"
                  placeholder={content.organizationPlaceholder}
                  value={form.organizationName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="form-field">
                <span>{content.contactNameLabel}</span>
                <input
                  name="contactName"
                  type="text"
                  placeholder={content.contactNamePlaceholder}
                  value={form.contactName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="form-field">
                <span>{content.emailLabel}</span>
                <input
                  name="email"
                  type="email"
                  placeholder={content.emailPlaceholder}
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="form-field">
                <span>{content.eventDateLabel}</span>
                <input
                  name="eventDate"
                  type="text"
                  placeholder={content.eventDatePlaceholder}
                  value={form.eventDate}
                  onChange={handleChange}
                />
              </label>
            </div>
            <label className="form-field">
              <span>{content.messageLabel}</span>
              <textarea
                name="message"
                rows={6}
                placeholder={content.messagePlaceholder}
                value={form.message}
                onChange={handleChange}
                required
              />
            </label>

            {submitMessage ? <p className="form-feedback form-feedback--success">{submitMessage}</p> : null}
            {submitError ? <p className="form-feedback form-feedback--error">{submitError}</p> : null}

            <button type="submit" className="button button--light form-submit" disabled={isSubmitting}>
              {isSubmitting ? content.submitPendingLabel : content.submitButtonLabel}
            </button>
          </motion.form>

          <motion.aside {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="contact-side-panel">
            <article id="contact-process" className="contact-side-card">
              <h3>{copy.processCardTitle}</h3>
              <div className="contact-process-list">
                {content.responseSteps.map((item) => (
                  <div key={item.step} className="contact-process-item">
                    <span>{item.step}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="contact-side-card">
              <h3>{copy.checklistCardTitle}</h3>
              <ul className="contact-checklist">
                {content.checklist.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article id="contact-info" className="contact-side-card contact-side-card--placeholder">
              <h3>{copy.placeholderCardTitle}</h3>
              <div className="placeholder-list">
                {content.contactInfo.map((item) => (
                  <a key={item.label} href={item.href || undefined}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </a>
                ))}
              </div>
            </article>
          </motion.aside>
        </div>
      </PageSectionBlock>
    ),
  };

  return (
    <>
      <PageMeta title="문의" description={copy.introDescription} />
      <PublicPageTemplate page="contact" blocks={blocks} />
    </>
  );
}
