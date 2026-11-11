import { useState } from "react";
import carmen from "@/assets/carmen-portrait.jpg";
import antonio from "@/assets/antonio-portrait.jpg";
import { DEMO_PERSON_IDS, personDisplayName } from "@/lib/person-presentation";

/** Fictional portraits are tied to demo IDs, never to a real person's name. */
export function PersonAvatar({ id, name, small = false }: { id?: string | null; name: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const photo = id === DEMO_PERSON_IDS.carmen ? carmen : id === DEMO_PERSON_IDS.antonio ? antonio : undefined;
  const size = small ? "size-10" : "size-12";
  return photo && !failed
    ? <img src={photo} alt="" width={48} height={48} loading="lazy" onError={() => setFailed(true)} className={`${size} shrink-0 rounded-full object-cover`} />
    : <span aria-hidden="true" className={`${size} grid shrink-0 place-items-center rounded-full bg-secondary font-extrabold text-primary`}>{personDisplayName(name).split(" ").filter(Boolean).map(part => part[0]).slice(0, 2).join("")}</span>;
}