using FitnessApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessApp.Api.Data
{
    public class FitnessAppDbContext : DbContext
    {
        public FitnessAppDbContext(DbContextOptions<FitnessAppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<TrainingSession> TrainingSessions { get; set; } = null!;
        public DbSet<Exercise> Exercises { get; set; } = null!;
        public DbSet<ExerciseSet> ExerciseSets { get; set; } = null!;
        public DbSet<NutritionalGoal> NutritionalGoals { get; set; } = null!;
        public DbSet<UserProfile> UserProfiles { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Relație unu-la-unu între User și UserProfile
            // User are un UserProfile opțional (?), UserProfile are un User necesar (!)
            modelBuilder.Entity<User>()
                .HasOne(u => u.UserProfile)       // User has one UserProfile
                .WithOne(up => up.User)           // UserProfile belongs to one User
                .HasForeignKey<UserProfile>(up => up.UserId); // FK este în UserProfile

            // Configure relationships and constraints here if needed
            // Example: One-to-one relationship between User and NutritionalGoal
            modelBuilder.Entity<User>()
                .HasOne(u => u.NutritionalGoal)
                .WithOne(ng => ng.User)
                .HasForeignKey<NutritionalGoal>(ng => ng.UserId);

            // Example: One-to-many relationship between User and TrainingSession
            modelBuilder.Entity<User>()
                .HasMany(u => u.TrainingSessions)
                .WithOne(ts => ts.User)
                .HasForeignKey(ts => ts.UserId);

            // Example: One-to-many relationship between TrainingSession and Exercise
            modelBuilder.Entity<TrainingSession>()
                .HasMany(ts => ts.Exercises)
                .WithOne(e => e.TrainingSession)
                .HasForeignKey(e => e.TrainingSessionId);

            // Example: One-to-many relationship between Exercise and ExerciseSet
            modelBuilder.Entity<Exercise>()
                .HasMany(e => e.Sets)
                .WithOne(es => es.Exercise)
                .HasForeignKey(es => es.ExerciseId);

            // Ensure User Email and Username are unique
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

        }
    }
}