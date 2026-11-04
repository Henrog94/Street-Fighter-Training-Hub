
import React from "react";
import FighterCard from "../components/FighterCard";
import SearchBar from "../components/SearchBar";
import { PageHeading, Empty } from "../components/Common";

export default function Fighters({
  characters,
  guides,
  importedFrames,
  filteredCharacters,
  filteredGuides,
  filteredFrames,
  query,
  setQuery,
  difficulty,
  setDifficulty,
  category,
  setCategory,
  setSelected,
  go,
  patchIndex,
  savedPlan,
  setSavedPlan,
  formSent,
  setFormSent
}) {
  return (
    <>

    
      <section className="section page-section fl-concept-fighters">
        <PageHeading
          eyebrow="ROSTER INTELLIGENCE"
          title={
            <>
              PICK YOUR <span>FIGHTER.</span>
            </>
          }
          desc="Explore playstyles, strengths, and signature moves. Find the fighter that fits your game plan."
        />


        {/* Fighter Search and Filters */}
        <div className="toolbar">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search fighters, roles, styles..."
          />

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>All</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <span className="result-count">
            {filteredCharacters.length} FIGHTERS FOUND
          </span>
        </div>

        {/* Existing Fighter Cards */}
        <div className="fighter-grid">
          {filteredCharacters.map((fighter, index) => (
            <FighterCard
              key={fighter.id}
              fighter={fighter}
              index={index}
              onSelect={setSelected}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredCharacters.length === 0 && <Empty />}
      </section>
    </>
  );
}
